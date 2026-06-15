from celery import shared_task
from .models import Exam, Question, AnswerKey
from rag.services import RAGGradingService
import easyocr

@shared_task
def process_exam_reference_task(exam_id):
    try:
        exam = Exam.objects.get(id=exam_id)
        exam.status = 'processing'
        exam.save()
        
        print(f"[{exam_id}] Extraction OCR du sujet et corrigé de référence (Images)...")
        reader = easyocr.Reader(['fr', 'en'], gpu=False)
        
        subject_text = ""
        reference_text = ""
        
        # Lecture directe des images
        if exam.subject_file:
            sub_res = reader.readtext(exam.subject_file.path, detail=0)
            subject_text = " ".join(sub_res)
            
        if exam.reference_file:
            ref_res = reader.readtext(exam.reference_file.path, detail=0)
            reference_text = " ".join(ref_res)

        combined_text = f"SUBJECT:\n{subject_text}\n\nCORRIGÉ/REFERENCE:\n{reference_text}"
        
        if not combined_text.strip() or combined_text == "SUBJECT:\n\n\nCORRIGÉ/REFERENCE:\n":
             raise ValueError("Aucun texte lisible n'a pu être extrait des images.")

        rag_service = RAGGradingService()
        parsed_data = rag_service.parse_exam_reference(combined_text)
        
        questions_data = parsed_data.get("questions", [])
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
                print(f"Erreur d'embedding: {e}")

        exam.status = 'done'
        exam.processing_log = f"Succès : {len(questions_data)} questions extraites."
        exam.save()
        print(f"[{exam_id}] Barème créé ! {len(questions_data)} questions enregistrées.")
        
    except Exception as e:
        print(f"Erreur lors du traitement de l'examen {exam_id}: {e}")
        try:
            exam = Exam.objects.get(id=exam_id)
            exam.status = 'error'
            exam.processing_log = str(e)
            exam.save()
        except:
            pass