from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from exams.models import Exam
from copies.models import StudentCopy

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id=None):
        if not request.user.is_teacher():
            return Response({"error": "Only teachers can view dashboard stats"}, status=403)
        
        if exam_id:
            exams = Exam.objects.filter(id=exam_id, teacher=request.user)
        else:
            exams = Exam.objects.filter(teacher=request.user)

        if not exams.exists() and exam_id:
            return Response({"error": "Exam not found"}, status=404)

        all_copies = StudentCopy.objects.filter(exam__in=exams)
        completed_copies = all_copies.filter(status='done')
        
        # MAGIE : Plus besoin de calculer manuellement, on utilise notre nouvelle propriété !
        copy_scores = [copy.grade_out_of_20 for copy in completed_copies]
        
        if copy_scores:
            avg_score = round(sum(copy_scores) / len(copy_scores), 2)
            success_count = sum(1 for s in copy_scores if s >= 10)
            success_rate = round((success_count / len(copy_scores)) * 100, 1)
        else:
            avg_score = 0
            success_rate = 0
        
        distribution = {"0-5": 0, "5-10": 0, "10-15": 0, "15-20": 0}
        for s in copy_scores:
            if s < 5: distribution["0-5"] += 1
            elif s < 10: distribution["5-10"] += 1
            elif s < 15: distribution["10-15"] += 1
            else: distribution["15-20"] += 1

        return Response({
            "total_exams": exams.count(),
            "total_copies": all_copies.count(),
            "average_score": avg_score,
            "success_rate": success_rate,
            "distribution": [
                {"name": "0-5", "count": distribution["0-5"]},
                {"name": "5-10", "count": distribution["5-10"]},
                {"name": "10-15", "count": distribution["10-15"]},
                {"name": "15-20", "count": distribution["15-20"]}
            ]
        })