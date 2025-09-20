from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from datetime import datetime, timedelta
from calendar import month_name

from complaints.models import Complaint, ComplaintFeedback, WithdrawalRequest
from departments.models import Department
from accounts.models import User
from core.models import ActivityLog
from core.utils import get_user_dashboard_stats
from accounts.permissions import CanViewAnalytics
from .serializers import (
    DashboardStatsSerializer, ComplaintAnalyticsSerializer,
    DepartmentAnalyticsSerializer, FeedbackAnalyticsSerializer,
    WithdrawalAnalyticsSerializer, SystemOverviewSerializer,
    UserActivitySerializer, MonthlyTrendSerializer
)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats_view(request):
    """
    Get dashboard statistics for the authenticated user
    """
    stats = get_user_dashboard_stats(request.user)
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewAnalytics])
def complaint_analytics_view(request):
    """
    Get comprehensive complaint analytics
    """
    # Filter complaints based on user role
    complaints = Complaint.objects.all()
    if request.user.role == 'DepartmentHead' and request.user.department:
        complaints = complaints.filter(department=request.user.department)
    
    # Complaints by status
    complaints_by_status = dict(
        complaints.values('status').annotate(count=Count('id')).values_list('status', 'count')
    )
    
    # Complaints by priority
    complaints_by_priority = dict(
        complaints.values('priority').annotate(count=Count('id')).values_list('priority', 'count')
    )
    
    # Complaints by department
    complaints_by_department = dict(
        complaints.values('department__name').annotate(count=Count('id')).values_list('department__name', 'count')
    )
    
    # Monthly trends (last 12 months)
    monthly_trends = []
    for i in range(12):
        date = timezone.now() - timedelta(days=30*i)
        month_start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        created_count = complaints.filter(created_at__range=[month_start, month_end]).count()
        resolved_count = complaints.filter(
            resolved_at__range=[month_start, month_end]
        ).count()
        
        monthly_trends.append({
            'month': month_name[date.month],
            'year': date.year,
            'complaints_created': created_count,
            'complaints_resolved': resolved_count
        })
    
    monthly_trends.reverse()
    
    # Resolution rate
    total_complaints = complaints.count()
    resolved_complaints = complaints.filter(status__in=['Resolved', 'Closed']).count()
    resolution_rate = (resolved_complaints / total_complaints * 100) if total_complaints > 0 else 0
    
    # Average resolution time (in days)
    resolved_with_time = complaints.filter(resolved_at__isnull=False)
    if resolved_with_time.exists():
        avg_resolution_time = resolved_with_time.aggregate(
            avg_time=Avg(F('resolved_at') - F('created_at'))
        )['avg_time']
        average_resolution_time = avg_resolution_time.days if avg_resolution_time else 0
    else:
        average_resolution_time = 0
    
    data = {
        'complaints_by_status': complaints_by_status,
        'complaints_by_priority': complaints_by_priority,
        'complaints_by_department': complaints_by_department,
        'monthly_trends': monthly_trends,
        'resolution_rate': round(resolution_rate, 2),
        'average_resolution_time': average_resolution_time
    }
    
    serializer = ComplaintAnalyticsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewAnalytics])
def department_analytics_view(request):
    """
    Get department-wise analytics
    """
    departments = Department.objects.filter(is_active=True)
    
    # Filter for department head
    if request.user.role == 'DepartmentHead' and request.user.department:
        departments = departments.filter(id=request.user.department.id)
    
    analytics_data = []
    for dept in departments:
        total_complaints = dept.complaints.count()
        pending_complaints = dept.complaints.filter(status='Pending').count()
        resolved_complaints = dept.complaints.filter(status__in=['Resolved', 'Closed']).count()
        resolution_rate = (resolved_complaints / total_complaints * 100) if total_complaints > 0 else 0
        
        analytics_data.append({
            'department_name': dept.name,
            'department_code': dept.code,
            'total_complaints': total_complaints,
            'pending_complaints': pending_complaints,
            'resolved_complaints': resolved_complaints,
            'resolution_rate': round(resolution_rate, 2),
            'staff_count': dept.get_staff_count(),
            'student_count': dept.get_student_count()
        })
    
    serializer = DepartmentAnalyticsSerializer(analytics_data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewAnalytics])
def feedback_analytics_view(request):
    """
    Get feedback analytics
    """
    feedback_queryset = ComplaintFeedback.objects.all()
    
    # Filter for department head
    if request.user.role == 'DepartmentHead' and request.user.department:
        feedback_queryset = feedback_queryset.filter(
            complaint__department=request.user.department
        )
    
    total_feedback = feedback_queryset.count()
    average_rating = feedback_queryset.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    
    # Rating distribution
    rating_distribution = dict(
        feedback_queryset.values('rating').annotate(count=Count('id')).values_list('rating', 'count')
    )
    
    # Feedback by department
    feedback_by_department = dict(
        feedback_queryset.values('complaint__department__name').annotate(
            count=Count('id')
        ).values_list('complaint__department__name', 'count')
    )
    
    data = {
        'total_feedback': total_feedback,
        'average_rating': round(average_rating, 2),
        'rating_distribution': rating_distribution,
        'feedback_by_department': feedback_by_department
    }
    
    serializer = FeedbackAnalyticsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewAnalytics])
def withdrawal_analytics_view(request):
    """
    Get withdrawal request analytics
    """
    withdrawals = WithdrawalRequest.objects.all()
    
    # Filter for department head
    if request.user.role == 'DepartmentHead' and request.user.department:
        withdrawals = withdrawals.filter(submitted_by__department=request.user.department)
    
    total_requests = withdrawals.count()
    pending_requests = withdrawals.filter(status='Pending').count()
    approved_requests = withdrawals.filter(status='Approved').count()
    rejected_requests = withdrawals.filter(status='Rejected').count()
    
    # Requests by type
    requests_by_type = dict(
        withdrawals.values('type').annotate(count=Count('id')).values_list('type', 'count')
    )
    
    # Requests by department
    requests_by_department = dict(
        withdrawals.values('submitted_by__department__name').annotate(
            count=Count('id')
        ).values_list('submitted_by__department__name', 'count')
    )
    
    data = {
        'total_requests': total_requests,
        'pending_requests': pending_requests,
        'approved_requests': approved_requests,
        'rejected_requests': rejected_requests,
        'requests_by_type': requests_by_type,
        'requests_by_department': requests_by_department
    }
    
    serializer = WithdrawalAnalyticsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def system_overview_view(request):
    """
    Get system-wide overview statistics (Admin/VC only)
    """
    if request.user.role not in ['Admin', 'VC']:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_departments = Department.objects.filter(is_active=True).count()
    total_complaints = Complaint.objects.count()
    total_withdrawals = WithdrawalRequest.objects.count()
    total_feedback = ComplaintFeedback.objects.count()
    
    # System health indicators
    pending_complaints = Complaint.objects.filter(status='Pending').count()
    overdue_complaints = Complaint.objects.filter(
        status__in=['Pending', 'In Progress'],
        created_at__lt=timezone.now() - timedelta(days=7)
    ).count()
    
    system_health = {
        'pending_complaints': pending_complaints,
        'overdue_complaints': overdue_complaints,
        'health_score': max(0, 100 - (overdue_complaints * 5))  # Simple health score
    }
    
    data = {
        'total_users': total_users,
        'active_users': active_users,
        'total_departments': total_departments,
        'total_complaints': total_complaints,
        'total_withdrawals': total_withdrawals,
        'total_feedback': total_feedback,
        'system_health': system_health
    }
    
    serializer = SystemOverviewSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_activity_view(request):
    """
    Get user activity analytics (Admin only)
    """
    if request.user.role != 'Admin':
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    users = User.objects.all().select_related('department')
    activity_data = []
    
    for user in users:
        total_complaints = user.created_complaints.count()
        total_activities = user.activity_logs.count()
        
        activity_data.append({
            'user_id': user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'role': user.role,
            'department': user.department.name if user.department else None,
            'last_login': user.last_login,
            'total_complaints': total_complaints,
            'total_activities': total_activities,
            'is_active': user.is_active
        })
    
    # Sort by last login (most recent first)
    activity_data.sort(key=lambda x: x['last_login'] or timezone.datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    
    serializer = UserActivitySerializer(activity_data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewAnalytics])
def monthly_trends_view(request):
    """
    Get monthly trends data for charts
    """
    trends = []
    
    for i in range(12):
        date = timezone.now() - timedelta(days=30*i)
        month_start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        # Filter based on user role
        complaints = Complaint.objects.all()
        withdrawals = WithdrawalRequest.objects.all()
        feedback = ComplaintFeedback.objects.all()
        
        if request.user.role == 'DepartmentHead' and request.user.department:
            complaints = complaints.filter(department=request.user.department)
            withdrawals = withdrawals.filter(submitted_by__department=request.user.department)
            feedback = feedback.filter(complaint__department=request.user.department)
        
        complaints_created = complaints.filter(created_at__range=[month_start, month_end]).count()
        complaints_resolved = complaints.filter(resolved_at__range=[month_start, month_end]).count()
        withdrawals_submitted = withdrawals.filter(created_at__range=[month_start, month_end]).count()
        feedback_received = feedback.filter(submitted_at__range=[month_start, month_end]).count()
        
        trends.append({
            'month': month_name[date.month],
            'year': date.year,
            'complaints_created': complaints_created,
            'complaints_resolved': complaints_resolved,
            'withdrawals_submitted': withdrawals_submitted,
            'feedback_received': feedback_received
        })
    
    trends.reverse()
    serializer = MonthlyTrendSerializer(trends, many=True)
    return Response(serializer.data)
