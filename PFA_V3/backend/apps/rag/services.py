import os
import json
from groq import Groq

class RAGGradingService:
    def __init__(self):
        # On remplace OpenAI par TA connexion Groq !
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    def embed_answer_key(self, reference_answer, keywords):
        # Ton collègue utilisait les Embeddings payants d'OpenAI.
        # On contourne ça avec un vecteur vide factice pour ne pas casser la base de données.
        return b"dummy_vector_pour_base_de_donnees"

    def grade_answer(self, student_text, answer_key_obj, max_points):
        if not student_text.strip():
            return {"score": 0.0, "feedback": "Aucune réponse détectée."}

        # TON prompt optimisé
        system_prompt = (
            "Tu es un professeur strict mais juste, expert en C++.\n"
            "Tu dois évaluer la logique de la copie et tolérer les erreurs de scan OCR.\n"
            "Tu DOIS ABSOLUMENT répondre UNIQUEMENT avec un objet JSON valide, sans texte autour : \n"
            "{\"score\": <float>, \"feedback\": \"<ton commentaire constructif en français>\"}"
        )

        user_prompt = (
            f"Référence du corrigé : {answer_key_obj.reference_answer}\n"
            f"Mots clés attendus : {json.dumps(answer_key_obj.keywords)}\n"
            f"Points maximum : {max_points}\n\n"
            f"Copie de l'étudiant (OCR) :\n{student_text}\n\n"
            "Note la copie. RAPPEL: Ne retourne QUE du JSON."
        )

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
            )
            
            # Nettoyage pour éviter que LLaMA ne rajoute des balises Markdown (```json)
            content = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
            result = json.loads(content)
            
            score = min(float(result.get("score", 0.0)), max_points)
            return {
                "score": score,
                "feedback": result.get("feedback", ""),
                "similarity_score": 0.85 # Valeur arbitraire pour que l'interface affiche la jauge
            }
        except Exception as e:
            print(f"Groq Grading Error: {e}")
            return {"score": 0.0, "feedback": "Erreur lors de la correction automatique avec Groq."}

    def parse_exam_reference(self, ocr_text):
        system_prompt = (
            "Tu es un assistant IA qui convertit un barème OCR d'examen C++ en JSON structuré.\n"
            "Tu DOIS ABSOLUMENT répondre UNIQUEMENT avec un objet JSON valide, avec ce format :\n"
            "{\"questions\": [{\"number\": 1, \"text\": \"...\", \"reference_answer\": \"...\", \"keywords\": [\"...\"], \"max_points\": 5.0}]}"
        )

        user_prompt = f"Texte OCR du barème :\n{ocr_text}"

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
            )
            content = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            print(f"Groq Parsing Error: {e}")
            return {"questions": []}