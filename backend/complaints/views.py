from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta

from .models import (
    Complaint, ComplaintForward, ComplaintResponse, ComplaintComment,
    ComplaintFeedback, WithdrawalRequest
)
from .serializers import (
    ComplaintCreateSerializer, ComplaintListSerializer, ComplaintDetailSerializer,
    ComplaintUpdateSerializer, ComplaintForwardSerializer, ComplaintResponseSerializer,
    ComplaintCommentSerializer, ComplaintCommentReplySerializer, ComplaintFeedbackSerializer,
    WithdrawalRequestSerializer, WithdrawalRequestReviewSerializer,
    ComplaintTrackSerializer, ComplaintStatsSerializer
)
from accounts.permissions import (
    IsStudentRole, IsStaffOrHigher, IsComplaintOwnerOrStaff,
    CanForwardComplaints, CanAssignComplaints, CanReplyToComment,
    CanSubmitFeedback, CanViewAnalytics, IsDepartmentHeadOrHigher
)
from core.utils import (
    log_activity, notify_complaint_created, notify_complaint_assigned,
    notify_complaint_forwarded, notify_complaint_commented, notify_complaint_replied,
    notify_complaint_status_changed, notify_withdrawal_submitted,
    notify_withdrawal_reviewed, notify_feedback_submitted, get_complaint_timeline
)


class ComplaintCreateView(generics.CreateAPIView):
    """
    API endpoint for creating complaints (students only)
    """
    serializer_class = ComplaintCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentRole]
    
    def perform_create(self, serializer):
        complaint = serializer.save()
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='create',
            description=f'Complaint created: {complaint.complaint_number}',
            related_item=complaint,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        notify_complaint_created(complaint)


class ComplaintListView(generics.ListAPIView):
    """
    API endpoint for listing complaints based on user role
    """
    serializer_class = ComplaintListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Complaint.objects.select_related(
            'created_by', 'assigned_to', 'department'
        )
        
        # Filter based on user role
        if user.role == 'Student':
            queryset = queryset.filter(created_by=user)
        elif user.role == 'Staff':
            queryset = queryset.filter(
                Q(assigned_to=user) | Q(department=user.department)
            )
        elif user.role == 'DepartmentHead':
            if user.department:
                queryset = queryset.filter(department=user.department)
        # VC and Admin can see all complaints
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        department_filter = self.request.query_params.get('department')
        if department_filter:
            queryset = queryset.filter(department_id=department_filter)
        
        is_urgent = self.request.query_params.get('is_urgent')
        if is_urgent is not None:
            queryset = queryset.filter(is_urgent=is_urgent.lower() == 'true')
        
        return queryset.order_by('-created_at')


class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for complaint details and updates
    """
    queryset = Complaint.objects.select_related('created_by', 'assigned_to', 'department')
    permission_classes = [permissions.IsAuthenticated, IsComplaintOwnerOrStaff]
    
    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return ComplaintUpdateSerializer
        return ComplaintDetailSerializer
    
    def perform_update(self, serializer):
        complaint = serializer.save()
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='update',
            description=f'Complaint updated: {complaint.complaint_number}',
            related_item=complaint,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications for status changes
        if 'status' in serializer.validated_data:
            notify_complaint_status_changed(complaint, self.request.user)
        
        # Send notifications for assignments
        if 'assigned_to' in serializer.validated_data and complaint.assigned_to:
            notify_complaint_assigned(complaint, self.request.user)


class ComplaintForwardView(generics.CreateAPIView):
    """
    API endpoint for forwarding complaints
    """
    serializer_class = ComplaintForwardSerializer
    permission_classes = [permissions.IsAuthenticated, CanForwardComplaints]
    
    def perform_create(self, serializer):
        forward = serializer.save()
        complaint = forward.complaint
        
        # Update complaint assignment
        complaint.assigned_to = forward.to_user
        complaint.save()
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='forward',
            description=f'Complaint forwarded: {complaint.complaint_number} to {forward.to_user.get_full_name()}',
            related_item=complaint,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        notify_complaint_forwarded(complaint, forward.from_user, forward.to_user)


class ComplaintResponseView(generics.ListCreateAPIView):
    """
    API endpoint for complaint responses
    """
    serializer_class = ComplaintResponseSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrHigher]
    
    def get_queryset(self):
        complaint_id = self.kwargs['complaint_id']
        return ComplaintResponse.objects.filter(
            complaint_id=complaint_id
        ).select_related('added_by').order_by('-created_at')
    
    def perform_create(self, serializer):
        complaint_id = self.kwargs['complaint_id']
        complaint = get_object_or_404(Complaint, id=complaint_id)
        
        # Check permissions
        if not (complaint.created_by == self.request.user or 
                complaint.assigned_to == self.request.user or
                self.request.user.role in ['Staff', 'DepartmentHead', 'VC', 'Admin']):
            raise permissions.PermissionDenied("You don't have permission to respond to this complaint")
        
        response = serializer.save(complaint=complaint)
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='create',
            description=f'Response added to complaint: {complaint.complaint_number}',
            related_item=complaint,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


class ComplaintCommentView(generics.ListCreateAPIView):
    """
    API endpoint for complaint comments
    """
    serializer_class = ComplaintCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrHigher]
    
    def get_queryset(self):
        complaint_id = self.kwargs['complaint_id']
        return ComplaintComment.objects.filter(
            complaint_id=complaint_id
        ).select_related('user').order_by('-created_at')
    
    def perform_create(self, serializer):
        complaint_id = self.kwargs['complaint_id']
        complaint = get_object_or_404(Complaint, id=complaint_id)
        
        comment = serializer.save(complaint=complaint)
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='comment',
            description=f'{comment.comment_type} added to complaint: {complaint.complaint_number}',
            related_item=complaint,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        notify_complaint_commented(complaint, comment)


class ComplaintCommentReplyView(generics.UpdateAPIView):
    """
    API endpoint for replying to comments (students only)
    """
    queryset = ComplaintComment.objects.all()
    serializer_class = ComplaintCommentReplySerializer
    permission_classes = [permissions.IsAuthenticated, CanReplyToComment]
    
    def perform_update(self, serializer):
        comment = serializer.save()
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='reply',
            description=f'Reply added to {comment.comment_type.lower()}: {comment.complaint.complaint_number}',
            related_item=comment.complaint,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        notify_complaint_replied(comment.complaint, comment)


class ComplaintFeedbackView(generics.CreateAPIView):
    """
    API endpoint for submitting complaint feedback
    """
    serializer_class = ComplaintFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentRole]
    
    def perform_create(self, serializer):
        feedback = serializer.save()
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='create',
            description=f'Feedback submitted for complaint: {feedback.complaint.complaint_number}',
            related_item=feedback.complaint,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        notify_feedback_submitted(feedback)


class ComplaintFeedbackListView(generics.ListAPIView):
    """
    API endpoint for viewing complaint feedback
    """
    serializer_class = ComplaintFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrHigher]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ComplaintFeedback.objects.select_related(
            'complaint', 'submitted_by', 'forwarded_to'
        )
        
        # Filter based on user role
        if user.role == 'Staff':
            queryset = queryset.filter(forwarded_to=user)
        elif user.role == 'DepartmentHead':
            if user.department:
                queryset = queryset.filter(complaint__department=user.department)
        # VC and Admin can see all feedback
        
        return queryset.order_by('-submitted_at')


class WithdrawalRequestCreateView(generics.CreateAPIView):
    """
    API endpoint for creating withdrawal requests (students only)
    """
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentRole]
    
    def perform_create(self, serializer):
        withdrawal = serializer.save()
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='create',
            description=f'Withdrawal request created: {withdrawal.request_number}',
            related_item=withdrawal,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        notify_withdrawal_submitted(withdrawal)


class WithdrawalRequestListView(generics.ListAPIView):
    """
    API endpoint for listing withdrawal requests
    """
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = WithdrawalRequest.objects.select_related(
            'submitted_by', 'reviewed_by'
        )
        
        # Filter based on user role
        if user.role == 'Student':
            queryset = queryset.filter(submitted_by=user)
        elif user.role == 'DepartmentHead':
            if user.department:
                queryset = queryset.filter(submitted_by__department=user.department)
        # VC and Admin can see all requests
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        
        return queryset.order_by('-created_at')


class WithdrawalRequestDetailView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for withdrawal request details and review
    """
    queryset = WithdrawalRequest.objects.select_related('submitted_by', 'reviewed_by')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'PATCH' and self.request.user.role in ['DepartmentHead', 'VC', 'Admin']:
            return WithdrawalRequestReviewSerializer
        return WithdrawalRequestSerializer
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Check permissions
        if user.role == 'Student' and obj.submitted_by != user:
            raise permissions.PermissionDenied("You can only view your own withdrawal requests")
        elif user.role == 'DepartmentHead' and user.department != obj.submitted_by.department:
            raise permissions.PermissionDenied("You can only view requests from your department")
        
        return obj
    
    def perform_update(self, serializer):
        withdrawal = serializer.save()
        
        # Log activity
        log_activity(
            user=self.request.user,
            action='update',
            description=f'Withdrawal request reviewed: {withdrawal.request_number}',
            related_item=withdrawal,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        notify_withdrawal_reviewed(withdrawal)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def track_complaint_view(request):
    """
    API endpoint for tracking complaints by number (public)
    """
    complaint_number = request.query_params.get('complaint_number')
    if not complaint_number:
        return Response({
            'error': 'complaint_number parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        complaint = Complaint.objects.select_related(
            'created_by', 'assigned_to', 'department'
        ).get(complaint_number=complaint_number)
        
        # Return limited information for public tracking
        data = {
            'complaint_number': complaint.complaint_number,
            'title': complaint.title,
            'status': complaint.status,
            'priority': complaint.priority,
            'department': complaint.department.name,
            'created_at': complaint.created_at,
            'updated_at': complaint.updated_at,
            'status_color': complaint.get_status_color(),
            'priority_color': complaint.get_priority_color(),
        }
        
        # Add resolution date if resolved
        if complaint.resolved_at:
            data['resolved_at'] = complaint.resolved_at
        
        return Response(data)
        
    except Complaint.DoesNotExist:
        return Response({
            'error': 'Complaint not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def complaint_timeline_view(request, complaint_id):
    """
    API endpoint for complaint timeline
    """
    complaint = get_object_or_404(Complaint, id=complaint_id)
    
    # Check permissions
    user = request.user
    if not (complaint.created_by == user or 
            complaint.assigned_to == user or
            user.role in ['Staff', 'DepartmentHead', 'VC', 'Admin']):
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    timeline = get_complaint_timeline(complaint)
    return Response(timeline)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewAnalytics])
def complaint_stats_view(request):
    """
    API endpoint for complaint statistics
    """
    # Basic counts
    total_complaints = Complaint.objects.count()
    pending_complaints = Complaint.objects.filter(status='Pending').count()
    in_progress_complaints = Complaint.objects.filter(status='In Progress').count()
    resolved_complaints = Complaint.objects.filter(status='Resolved').count()
    rejected_complaints = Complaint.objects.filter(status='Rejected').count()
    closed_complaints = Complaint.objects.filter(status='Closed').count()
    
    # Average resolution time
    resolved_with_time = Complaint.objects.filter(
        status='Resolved',
        resolved_at__isnull=False
    )
    
    avg_resolution_time = 0
    if resolved_with_time.exists():
        total_time = sum([
            (complaint.resolved_at - complaint.created_at).total_seconds() / 3600
            for complaint in resolved_with_time
        ])
        avg_resolution_time = total_time / resolved_with_time.count()
    
    # Complaints by priority
    priority_stats = Complaint.objects.values('priority').annotate(
        count=Count('id')
    ).order_by('priority')
    complaints_by_priority = {item['priority']: item['count'] for item in priority_stats}
    
    # Complaints by department
    dept_stats = Complaint.objects.select_related('department').values(
        'department__name'
    ).annotate(count=Count('id')).order_by('-count')
    complaints_by_department = {item['department__name']: item['count'] for item in dept_stats}
    
    # Recent complaints (last 30 days)
    recent_complaints = Complaint.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=30)
    ).count()
    
    stats = {
        'total_complaints': total_complaints,
        'pending_complaints': pending_complaints,
        'in_progress_complaints': in_progress_complaints,
        'resolved_complaints': resolved_complaints,
        'rejected_complaints': rejected_complaints,
        'closed_complaints': closed_complaints,
        'average_resolution_time': round(avg_resolution_time, 2),
        'complaints_by_priority': complaints_by_priority,
        'complaints_by_department': complaints_by_department,
        'recent_complaints': recent_complaints,
    }
    
    serializer = ComplaintStatsSerializer(stats)
    return Response(serializer.data)
