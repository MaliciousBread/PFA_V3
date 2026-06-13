import os
import json
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class RAGGradingService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small", 
            openai_api_key=os.environ.get("OPENAI_API_KEY")
        )
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0.2,
            openai_api_key=os.environ.get("OPENAI_API_KEY")
        )

    def embed_answer_key(self, reference_answer, keywords):
        text_to_embed = f"Reference: {reference_answer}\nKeywords: {', '.join(keywords)}"
        vector = self.embeddings.embed_query(text_to_embed)
        # Convert to bytes for storage in BinaryField
        return np.array(vector, dtype=np.float32).tobytes()

    def grade_answer(self, student_text, answer_key_obj, max_points):
        if not student_text.strip():
            return {"score": 0.0, "feedback": "Aucune réponse détectée."}
            
        # Optional: compute cosine similarity
        student_vector = self.embeddings.embed_query(student_text)
        
        similarity = 0.0
        if answer_key_obj.embedding_vector:
            key_vector = np.frombuffer(answer_key_obj.embedding_vector, dtype=np.float32)
            similarity = cosine_similarity([student_vector], [key_vector])[0][0]

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a strict but fair academic grader specialized in C++ programming.\n"
                       "You are an expert in C++ syntax, OOP (classes, inheritance, polymorphism, encapsulation), "
                       "pointers, memory management (new/delete, smart pointers), STL containers, templates, "
                       "operator overloading, and modern C++ features (C++11/14/17/20).\n"
                       "Always respond ONLY with valid JSON: {{\"score\": <float>, \"feedback\": \"<string in French>\"}}"),
            ("user", "Reference answer: {reference_answer}\n"
                     "Required keywords: {keywords}\n"
                     "Maximum points: {max_points}\n\n"
                     "Student's answer (OCR extracted, may contain noise):\n{student_answer}\n\n"
                     "Grade the student's C++ answer considering semantic equivalence, not exact wording. "
                     "Pay attention to C++ specific concepts: correct use of pointers, proper class design, "
                     "memory management, and syntax accuracy. "
                     "Penalize missing key concepts. Provide a 1-2 sentence feedback in French.")
        ])

        chain = prompt | self.llm
        
        try:
            response = chain.invoke({
                "reference_answer": answer_key_obj.reference_answer,
                "keywords": json.dumps(answer_key_obj.keywords),
                "max_points": max_points,
                "student_answer": student_text
            })
            
            # Clean up response content in case LLM wraps it in markdown block
            content = response.content.replace("```json", "").replace("```", "").strip()
            result = json.loads(content)
            
            # Ensure score doesn't exceed max points
            score = min(float(result.get("score", 0.0)), max_points)
            return {
                "score": score,
                "feedback": result.get("feedback", ""),
                "similarity_score": float(similarity)
            }
        except Exception as e:
            print(f"LLM Grading Error: {e}")
            return {"score": 0.0, "feedback": "Erreur lors de la correction automatique."}

    def parse_exam_reference(self, ocr_text):
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant that converts unstructured OCR text from a C++ exam reference document into structured JSON.\n"
                       "Extract each question, its number, its reference answer (including C++ code if present), and suggested keywords.\n"
                       "Focus on C++ concepts: classes, inheritance, polymorphism, pointers, memory management, STL, templates, etc.\n"
                       "If points are mentioned, extract them too.\n"
                       "Respond ONLY with valid JSON: {{\"questions\": [{{\"number\": 1, \"text\": \"...\", \"reference_answer\": \"...\", \"keywords\": [\"...\"], \"max_points\": 5.0}}, ...]}}"),
            ("user", "OCR Text:\n{ocr_text}")
        ])

        chain = prompt | self.llm
        
        try:
            response = chain.invoke({"ocr_text": ocr_text})
            content = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            print(f"LLM Parsing Error: {e}")
            return {"questions": []}
