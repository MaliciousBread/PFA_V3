from celery import shared_task
from .models import Exam, Question, AnswerKey
from ocr.services import OCRService
from rag.services import RAGGradingService
import os
import pytesseract
from PIL import Image

@shared_task
def process_exam_reference_task(exam_id):
    try:
        exam = Exam.objects.get(id=exam_id)
        exam.status = 'processing'
        exam.save()
        
        # 1. OCR Extraction
        ocr_service = OCRService()
        
        subject_text = ""
        reference_text = ""
        
        # Extract text from subject file if exists
        if exam.subject_file:
            img = Image.open(exam.subject_file.path)
            subject_text = pytesseract.image_to_string(img, lang='fra+eng')
            
        # Extract text from reference file if exists
        if exam.reference_file:
            img = Image.open(exam.reference_file.path)
            reference_text = pytesseract.image_to_string(img, lang='fra+eng')

        # Combine or handle separately
        combined_text = f"SUBJECT:\n{subject_text}\n\nCORRIGÉ/REFERENCE:\n{reference_text}"

        # 2. LLM Parsing
        rag_service = RAGGradingService()
        # We might need a more specialized prompt if we have two separate texts
        parsed_data = rag_service.parse_exam_reference(combined_text)
        
        questions_data = parsed_data.get("questions", [])
        
        # Delete existing questions if any
        exam.questions.all().delete()
        
        for q_data in questions_data:
            question = Question.objects.create(
                exam=exam,
                number=q_data.get("number"),
                text=q_data.get("text"),
                max_points=q_data.get("max_points", 5.0)
            )
            
            AnswerKey.objects.create(
                question=question,
                reference_answer=q_data.get("reference_answer", ""),
                keywords=q_data.get("keywords", [])
            )
            
            try:
                ak = question.answer_key
                ak.embedding_vector = rag_service.embed_answer_key(ak.reference_answer, ak.keywords)
                ak.save()
            except Exception as e:
                print(f"Embedding error: {e}")

        exam.status = 'done'
        exam.processing_log = f"Extracted {len(questions_data)} questions successfully."
        exam.save()
        
    except Exception as e:
        print(f"Error processing exam reference {exam_id}: {e}")
        try:
            exam = Exam.objects.get(id=exam_id)
            exam.status = 'error'
            exam.processing_log = str(e)
            exam.save()
        except:
            pass
