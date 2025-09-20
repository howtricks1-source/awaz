from django.urls import path
from .views import (
    NotificationListView, NotificationDetailView,
    mark_notifications_read_view, mark_all_notifications_read_view,
    notification_stats_view, delete_notification_view
)

app_name = 'notifications'

urlpatterns = [
    # Notification management
    path('', NotificationListView.as_view(), name='notification_list'),
    path('<int:pk>/', NotificationDetailView.as_view(), name='notification_detail'),
    path('<int:notification_id>/delete/', delete_notification_view, name='notification_delete'),
    
    # Bulk operations
    path('mark-read/', mark_notifications_read_view, name='mark_notifications_read'),
    path('mark-all-read/', mark_all_notifications_read_view, name='mark_all_notifications_read'),
    
    # Statistics
    path('stats/', notification_stats_view, name='notification_stats'),
]

