from rest_framework import serializers
from django.db.models import Count, Q, Avg
from complaints.models import Complaint, ComplaintFeedback, WithdrawalRequest
from departments.models import Department
from accounts.models import User


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics based on user role
    """
    # Common stats
    total_complaints = serializers.IntegerField(read_only=True)
    pending_complaints = serializers.IntegerField(read_only=True)
    resolved_complaints = serializers.IntegerField(read_only=True)
    unread_notifications = serializers.IntegerField(read_only=True)
    
    # Role-specific stats
    my_complaints = serializers.IntegerField(read_only=True, required=False)
    assigned_complaints = serializers.IntegerField(read_only=True, required=False)
    department_complaints = serializers.IntegerField(read_only=True, required=False)
    total_withdrawals = serializers.IntegerField(read_only=True, required=False)
    pending_withdrawals = serializers.IntegerField(read_only=True, required=False)
    unresolved_complaints = serializers.IntegerField(read_only=True, required=False)


class ComplaintAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for complaint analytics data
    """
    complaints_by_status = serializers.DictField(read_only=True)
    complaints_by_priority = serializers.DictField(read_only=True)
    complaints_by_department = serializers.DictField(read_only=True)
    monthly_trends = serializers.ListField(read_only=True)
    resolution_rate = serializers.FloatField(read_only=True)
    average_resolution_time = serializers.FloatField(read_only=True)


class DepartmentAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for department-wise analytics
    """
    department_name = serializers.CharField(read_only=True)
    department_code = serializers.CharField(read_only=True)
    total_complaints = serializers.IntegerField(read_only=True)
    pending_complaints = serializers.IntegerField(read_only=True)
    resolved_complaints = serializers.IntegerField(read_only=True)
    resolution_rate = serializers.FloatField(read_only=True)
    staff_count = serializers.IntegerField(read_only=True)
    student_count = serializers.IntegerField(read_only=True)


class FeedbackAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for feedback analytics
    """
    total_feedback = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    rating_distribution = serializers.DictField(read_only=True)
    feedback_by_department = serializers.DictField(read_only=True)


class WithdrawalAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for withdrawal request analytics
    """
    total_requests = serializers.IntegerField(read_only=True)
    pending_requests = serializers.IntegerField(read_only=True)
    approved_requests = serializers.IntegerField(read_only=True)
    rejected_requests = serializers.IntegerField(read_only=True)
    requests_by_type = serializers.DictField(read_only=True)
    requests_by_department = serializers.DictField(read_only=True)


class SystemOverviewSerializer(serializers.Serializer):
    """
    Serializer for system-wide overview statistics
    """
    total_users = serializers.IntegerField(read_only=True)
    active_users = serializers.IntegerField(read_only=True)
    total_departments = serializers.IntegerField(read_only=True)
    total_complaints = serializers.IntegerField(read_only=True)
    total_withdrawals = serializers.IntegerField(read_only=True)
    total_feedback = serializers.IntegerField(read_only=True)
    system_health = serializers.DictField(read_only=True)


class UserActivitySerializer(serializers.Serializer):
    """
    Serializer for user activity analytics
    """
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)
    department = serializers.CharField(read_only=True, allow_null=True)
    last_login = serializers.DateTimeField(read_only=True)
    total_complaints = serializers.IntegerField(read_only=True)
    total_activities = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)


class MonthlyTrendSerializer(serializers.Serializer):
    """
    Serializer for monthly trend data
    """
    month = serializers.CharField(read_only=True)
    year = serializers.IntegerField(read_only=True)
    complaints_created = serializers.IntegerField(read_only=True)
    complaints_resolved = serializers.IntegerField(read_only=True)
    withdrawals_submitted = serializers.IntegerField(read_only=True)
    feedback_received = serializers.IntegerField(read_only=True)
