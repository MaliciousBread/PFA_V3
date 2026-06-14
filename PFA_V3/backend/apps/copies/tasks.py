from celery import shared_task
from .models import StudentCopy, StudentAnswer
from ocr.services import OCRService
from rag.services import RAGGradingService
import os
from pdf2image import convert_from_path
import tempfile

@shared_task
def process_student_copy_task(copy_id):
    try:
        copy = StudentCopy.objects.get(id=copy_id)
        exam = copy.exam
        questions = exam.questions.all().order_by('number')
        
        # 1. OCR Extraction
        ocr_service = OCRService()
        extracted_texts = ocr_service.process_copy(copy.scan_file.path, questions.count())
        
        # 2. RAG Grading
        rag_service = RAGGradingService()
        
        for q_idx, question in enumerate(questions):
            q_num = q_idx + 1
            student_text = extracted_texts.get(q_num, "")
            
            # Save raw OCR text first
            answer, created = StudentAnswer.objects.get_or_create(
                copy=copy, 
                question=question,
                defaults={'raw_text': student_text}
            )
            if not created:
                answer.raw_text = student_text
                answer.save()
            
            # Grade if answer key exists
            if hasattr(question, 'answer_key'):
                grading_result = rag_service.grade_answer(
                    student_text, 
                    question.answer_key, 
                    question.max_points
                )
                answer.score = grading_result.get("score")
                answer.feedback = grading_result.get("feedback")
                answer.save()
                
        # Mark as done
        copy.status = 'done'
        copy.save()
        
    except Exception as e:
        print(f"Error processing copy {copy_id}: {e}")
        try:
            copy = StudentCopy.objects.get(id=copy_id)
            copy.status = 'error'
            copy.save()
        except:
            pass
