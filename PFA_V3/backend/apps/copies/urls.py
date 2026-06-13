from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentCopyViewSet, StudentAnswerViewSet

router = DefaultRouter()
router.register(r'answers', StudentAnswerViewSet, basename='answer')
router.register(r'', StudentCopyViewSet, basename='copy')

urlpatterns = [
    path('', include(router.urls)),
]
