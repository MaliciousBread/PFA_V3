from django.urls import path
from .views import DashboardStatsView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats-general'),
    path('stats/<int:exam_id>/', DashboardStatsView.as_view(), name='dashboard-stats-exam'),
]
