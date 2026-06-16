from rest_framework import serializers
from .models import StudentCopy, StudentAnswer

class StudentAnswerSerializer(serializers.ModelSerializer):
    final_score = serializers.FloatField(read_only=True)
    
    class Meta:
        model = StudentAnswer
        fields = '__all__'

class StudentCopySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    
    # ⚠️ LE RETOUR DES RÉPONSES ! (C'est ça qui manquait)
    answers = StudentAnswerSerializer(many=True, read_only=True)
    
    # Nos propriétés de calcul
    grade_out_of_20 = serializers.FloatField(read_only=True)
    exam_total_points = serializers.FloatField(read_only=True)
    raw_total_score = serializers.FloatField(read_only=True)

    class Meta:
        model = StudentCopy
        fields = [
            'id', 'exam', 'exam_title', 'student', 'student_name', 
            'scan_file', 'status', 'uploaded_at', 
            'grade_out_of_20', 'exam_total_points', 'raw_total_score',
            'answers' # <-- TRÈS IMPORTANT, ON L'AJOUTE ICI
        ]