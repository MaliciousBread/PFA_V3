from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from exams.models import Exam
from copies.models import StudentCopy, StudentAnswer
from django.db.models import Avg, Count
import statistics

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id=None):
        if not request.user.is_teacher():
            return Response({"error": "Only teachers can view dashboard stats"}, status=403)
        
        if exam_id:
            try:
                exam = Exam.objects.get(id=exam_id, teacher=request.user)
                copies = StudentCopy.objects.filter(exam=exam, status='done')
                answers = StudentAnswer.objects.filter(copy__in=copies)
                
                # Calculate scores per copy
                copy_scores = []
                for copy in copies:
                    score = sum([a.final_score for a in copy.answers.all() if a.final_score is not None])
                    copy_scores.append(score)
                
                if copy_scores:
                    avg_score = sum(copy_scores) / len(copy_scores)
                    median_score = statistics.median(copy_scores)
                else:
                    avg_score = 0
                    median_score = 0
                
                # Grade distribution
                distribution = {}
                for score in copy_scores:
                    bucket = f"{int(score)}-{int(score)+1}"
                    distribution[bucket] = distribution.get(bucket, 0) + 1

                return Response({
                    "total_copies": copies.count(),
                    "average_score": avg_score,
                    "median_score": median_score,
                    "distribution": distribution
                })
            except Exam.DoesNotExist:
                return Response({"error": "Exam not found"}, status=404)
        else:
            # General stats for all exams
            exams = Exam.objects.filter(teacher=request.user)
            total_copies = StudentCopy.objects.filter(exam__in=exams).count()
            return Response({
                "total_exams": exams.count(),
                "total_copies": total_copies,
            })
