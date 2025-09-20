from django.urls import path
from .views import (
    dashboard_stats_view, complaint_analytics_view, department_analytics_view,
    feedback_analytics_view, withdrawal_analytics_view, system_overview_view,
    user_activity_view, monthly_trends_view
)

app_name = 'analytics'

urlpatterns = [
    # Dashboard statistics
    path('dashboard/', dashboard_stats_view, name='dashboard_stats'),
    
    # Analytics endpoints
    path('complaints/', complaint_analytics_view, name='complaint_analytics'),
    path('departments/', department_analytics_view, name='department_analytics'),
    path('feedback/', feedback_analytics_view, name='feedback_analytics'),
    path('withdrawals/', withdrawal_analytics_view, name='withdrawal_analytics'),
    path('trends/', monthly_trends_view, name='monthly_trends'),
    
    # System overview (Admin/VC only)
    path('system/', system_overview_view, name='system_overview'),
    path('users/', user_activity_view, name='user_activity'),
]
