from rest_framework import viewsets, permissions
from .models import Exam, Question
from .serializers import ExamSerializer, QuestionSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class IsTeacherOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_teacher()

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_teacher():
            return Exam.objects.filter(teacher=user)
        # Students might need to see exams they've taken or all available exams
        return Exam.objects.all()

    def perform_create(self, serializer):
        exam = serializer.save(teacher=self.request.user)
        if exam.subject_file or exam.reference_file:
            from .tasks import process_exam_reference_task
            exam.status = 'pending'
            exam.save()
            process_exam_reference_task.delay(exam.id)

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]

    def get_queryset(self):
        return Question.objects.filter(exam_id=self.kwargs['exam_pk'])

    def perform_create(self, serializer):
        exam = Exam.objects.get(pk=self.kwargs['exam_pk'])
        serializer.save(exam=exam)
