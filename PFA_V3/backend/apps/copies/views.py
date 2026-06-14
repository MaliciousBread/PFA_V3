from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import StudentCopy, StudentAnswer
from .serializers import StudentCopySerializer, StudentAnswerSerializer

class IsTeacherOrStudentOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_teacher():
            return True
        return obj.student == request.user

class StudentCopyViewSet(viewsets.ModelViewSet):
    queryset = StudentCopy.objects.all()
    serializer_class = StudentCopySerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrStudentOwner]

    def get_queryset(self):
        user = self.request.user
        if user.is_teacher():
            return StudentCopy.objects.filter(exam__teacher=user)
        return StudentCopy.objects.filter(student=user)

    def create(self, request, *args, **kwargs):
        from users.models import User
        data = request.data.copy()
        
        # If student_name is provided instead of student ID
        if 'student_name' in data and not data.get('student'):
            try:
                student_user = User.objects.get(username=data['student_name'])
                data['student'] = student_user.id
            except User.DoesNotExist:
                return Response({"error": f"Student '{data['student_name']}' not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Automatically trigger processing after upload
        copy = serializer.instance
        from .tasks import process_student_copy_task
        copy.status = 'processing'
        copy.save()
        process_student_copy_task.delay(copy.id)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # The clean, Django-native way to delete the physical file
        if instance.file:
            instance.file.delete(save=False) 
                
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


    def process(self, request, pk=None):
        if not request.user.is_teacher():
            return Response({"error": "Only teachers can trigger processing"}, status=status.HTTP_403_FORBIDDEN)
        
        copy = self.get_object()
        if copy.status in ['processing', 'done']:
            return Response({"error": f"Copy is already {copy.status}"}, status=status.HTTP_400_BAD_REQUEST)
        
        copy.status = 'processing'
        copy.save()
        
        # Trigger Celery Task
        from .tasks import process_student_copy_task
        process_student_copy_task.delay(copy.id)
        
        return Response({"success": True, "message": "Processing started"})

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        copy = self.get_object()
        serializer = self.get_serializer(copy)
        return Response(serializer.data)

class StudentAnswerViewSet(viewsets.ModelViewSet):
    queryset = StudentAnswer.objects.all()
    serializer_class = StudentAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_teacher():
            return StudentAnswer.objects.filter(copy__exam__teacher=user)
        return StudentAnswer.objects.filter(copy__student=user)

    @action(detail=True, methods=['patch'])
    def override(self, request, pk=None):
        if not request.user.is_teacher():
            return Response({"error": "Only teachers can override scores"}, status=status.HTTP_403_FORBIDDEN)
        
        answer = self.get_object()
        new_score = request.data.get('teacher_override_score')
        if new_score is None:
            return Response({"error": "teacher_override_score is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        answer.teacher_override_score = float(new_score)
        answer.save()
        
        return Response({"success": True, "data": StudentAnswerSerializer(answer).data})
