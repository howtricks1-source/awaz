from django.urls import path
from .views import (
    ComplaintCreateView, ComplaintListView, ComplaintDetailView,
    ComplaintForwardView, ComplaintResponseView, ComplaintCommentView,
    ComplaintCommentReplyView, ComplaintFeedbackView, ComplaintFeedbackListView,
    WithdrawalRequestCreateView, WithdrawalRequestListView, WithdrawalRequestDetailView,
    track_complaint_view, complaint_timeline_view, complaint_stats_view
)

app_name = 'complaints'

urlpatterns = [
    # Complaint management
    path('', ComplaintListView.as_view(), name='complaint_list'),
    path('create/', ComplaintCreateView.as_view(), name='complaint_create'),
    path('<int:pk>/', ComplaintDetailView.as_view(), name='complaint_detail'),
    path('forward/', ComplaintForwardView.as_view(), name='complaint_forward'),
    
    # Complaint responses and comments
    path('<int:complaint_id>/responses/', ComplaintResponseView.as_view(), name='complaint_responses'),
    path('<int:complaint_id>/comments/', ComplaintCommentView.as_view(), name='complaint_comments'),
    path('comments/<int:pk>/reply/', ComplaintCommentReplyView.as_view(), name='comment_reply'),
    
    # Complaint feedback
    path('feedback/', ComplaintFeedbackView.as_view(), name='complaint_feedback_create'),
    path('feedback/list/', ComplaintFeedbackListView.as_view(), name='complaint_feedback_list'),
    
    # Withdrawal requests
    path('withdrawals/', WithdrawalRequestListView.as_view(), name='withdrawal_list'),
    path('withdrawals/create/', WithdrawalRequestCreateView.as_view(), name='withdrawal_create'),
    path('withdrawals/<int:pk>/', WithdrawalRequestDetailView.as_view(), name='withdrawal_detail'),
    
    # Public and utility endpoints
    path('track/', track_complaint_view, name='track_complaint'),
    path('<int:complaint_id>/timeline/', complaint_timeline_view, name='complaint_timeline'),
    path('stats/', complaint_stats_view, name='complaint_stats'),
]

