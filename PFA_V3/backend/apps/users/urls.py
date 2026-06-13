from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LogoutView, CustomTokenObtainPairView, RegisterView

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
