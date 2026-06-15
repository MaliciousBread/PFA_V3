from celery import shared_task
from .models import StudentCopy, StudentAnswer
from rag.services import RAGGradingService
import easyocr

@shared_task
def process_student_copy_task(copy_id):
    try:
        copy = StudentCopy.objects.get(id=copy_id)
        exam = copy.exam
        questions = exam.questions.all().order_by('number')
        
        if questions.count() == 0:
            raise ValueError("L'examen ne contient aucune question. Vérifiez le barème.")

        # Récupération du chemin de l'image
        file_path = copy.file.path if hasattr(copy, 'file') and copy.file else copy.scan_file.path
        
        print(f"[{copy_id}] Démarrage de l'OCR pour l'image : {file_path}")
        reader = easyocr.Reader(['en', 'fr'], gpu=False)

        # Extraction directe depuis l'image (PNG/JPG)
        result = reader.readtext(file_path, detail=0)
        extracted_text = " ".join(result)

        # Évaluation RAG avec Groq
        rag_service = RAGGradingService()
        
        for q_idx, question in enumerate(questions):
            answer, created = StudentAnswer.objects.get_or_create(
                copy=copy, 
                question=question,
                defaults={'raw_text': extracted_text[:2000]}
            )
            if not created:
                answer.raw_text = extracted_text[:2000]
                answer.save()
            
            if hasattr(question, 'answer_key'):
                grading_result = rag_service.grade_answer(
                    student_text=extracted_text, 
                    answer_key_obj=question.answer_key, 
                    max_points=question.max_points
                )
                answer.score = grading_result.get("score", 0.0)
                answer.feedback = grading_result.get("feedback", "Pas de retour.")
                answer.save()
                
        copy.status = 'done'
        copy.save()
        print(f"[{copy_id}] Copie corrigée avec succès !")
        
    except Exception as e:
        print(f"Error processing copy {copy_id}: {e}")
        try:
            copy = StudentCopy.objects.get(id=copy_id)
            copy.status = 'error'
            copy.save()
        except:
            pass