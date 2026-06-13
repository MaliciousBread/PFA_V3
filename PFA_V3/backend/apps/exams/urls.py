from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, QuestionViewSet

router = DefaultRouter()
router.register(r'', ExamViewSet, basename='exam')

question_list = QuestionViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

question_detail = QuestionViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('<int:exam_pk>/questions/', question_list, name='question-list'),
    path('<int:exam_pk>/questions/<int:pk>/', question_detail, name='question-detail'),
    path('', include(router.urls)),
]
