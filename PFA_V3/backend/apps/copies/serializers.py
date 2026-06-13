from rest_framework import serializers
from .models import StudentCopy, StudentAnswer
from exams.serializers import ExamSerializer

class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_number = serializers.IntegerField(source='question.number', read_only=True)
    max_points = serializers.FloatField(source='question.max_points', read_only=True)

    class Meta:
        model = StudentAnswer
        fields = [
            'id', 'question', 'question_text', 'question_number', 
            'max_points', 'raw_text', 'score', 'feedback', 
            'teacher_override_score', 'final_score'
        ]

class StudentCopySerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = StudentCopy
        fields = ['id', 'exam', 'exam_title', 'student', 'student_name', 'scan_file', 'status', 'uploaded_at', 'answers']
        read_only_fields = ['status', 'uploaded_at']
