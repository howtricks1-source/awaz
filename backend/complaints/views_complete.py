"""
Complete API views for the Hamari Awaz complaint management system
"""
from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg, F, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta, datetime
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import (
    Complaint, ComplaintForward, ComplaintResponse, ComplaintComment,
    ComplaintFeedback, WithdrawalRequest, Notification, ActivityLog
)
from .serializers import (
    ComplaintCreateSerializer, ComplaintListSerializer, ComplaintDetailSerializer,
    ComplaintUpdateSerializer, ComplaintForwardSerializer, ComplaintResponseSerializer,
    ComplaintCommentSerializer, ComplaintCommentReplySerializer, ComplaintFeedbackSerializer,
    WithdrawalRequestSerializer, WithdrawalRequestReviewSerializer,
    ComplaintTrackSerializer, ComplaintStatsSerializer, NotificationSerializer,
    NotificationMarkReadSerializer, ActivityLogSerializer, UserBasicSerializer,
    DepartmentBasicSerializer, ComplaintTimelineSerializer, AnalyticsSerializer,
    FileUploadSerializer, BulkActionSerializer
)
from accounts.models import User
from departments.models import Department
from core.logging import ActivityLogger, NotificationManager

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============================================================================
# COMPLAINT VIEWS
# ============================================================================

class ComplaintViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD operations for complaints
    """
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ComplaintCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ComplaintUpdateSerializer
        elif self.action == 'retrieve':
            return ComplaintDetailSerializer
        return ComplaintListSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Complaint.objects.select_related(
            'created_by', 'assigned_to', 'department'
        ).prefetch_related('forwards', 'responses', 'comments', 'feedback')
        
        # Role-based filtering
        if user.role == 'Student':
            queryset = queryset.filter(created_by=user)
        elif user.role == 'Staff':
            queryset = queryset.filter(
                Q(assigned_to=user) | Q(department=user.department)
            )
        elif user.role == 'DepartmentHead':
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
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(complaint_number__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        complaint = serializer.save()
        
        # Log activity
        ActivityLogger.log_complaint_activity(
            user=self.request.user,
            complaint=complaint,
            action='create',
            description=f'Created complaint: {complaint.complaint_number}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        NotificationManager.notify_complaint_created(complaint)
    
    def perform_update(self, serializer):
        old_status = serializer.instance.status
        complaint = serializer.save()
        
        # Log activity
        ActivityLogger.log_complaint_activity(
            user=self.request.user,
            complaint=complaint,
            action='update',
            description=f'Updated complaint: {complaint.complaint_number}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Check for status change
        if old_status != complaint.status:
            NotificationManager.notify_status_changed(
                complaint, old_status, complaint.status, self.request.user
            )
    
    @action(detail=True, methods=['post'])
    def forward(self, request, pk=None):
        """Forward complaint to another user"""
        complaint = self.get_object()
        serializer = ComplaintForwardSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            forward = serializer.save(complaint=complaint)
            
            # Update complaint assignment
            complaint.assigned_to = forward.to_user
            complaint.save()
            
            # Log activity
            ActivityLogger.log_complaint_activity(
                user=request.user,
                complaint=complaint,
                action='forward',
                description=f'Forwarded complaint to {forward.to_user.get_full_name()}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            # Send notification
            NotificationManager.notify_complaint_forwarded(
                complaint, forward.from_user, forward.to_user, forward.remarks
            )
            
            return Response(ComplaintForwardSerializer(forward).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_response(self, request, pk=None):
        """Add official response to complaint"""
        complaint = self.get_object()
        serializer = ComplaintResponseSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            response = serializer.save(complaint=complaint)
            
            # Log activity
            ActivityLogger.log_complaint_activity(
                user=request.user,
                complaint=complaint,
                action='comment',
                description=f'Added response to complaint',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            return Response(ComplaintResponseSerializer(response).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Get or add comments to complaint"""
        complaint = self.get_object()
        
        if request.method == 'GET':
            comments = complaint.comments.all().order_by('created_at')
            serializer = ComplaintCommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = ComplaintCommentSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                comment = serializer.save(complaint=complaint)
                
                # Log activity
                ActivityLogger.log_complaint_activity(
                    user=request.user,
                    complaint=complaint,
                    action='comment',
                    description=f'Added {comment.comment_type.lower()}: {comment.text[:50]}...',
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )
                
                # Send notification
                NotificationManager.notify_comment_added(complaint, comment)
                
                return Response(ComplaintCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='comments/(?P<comment_id>[^/.]+)/reply')
    def reply_to_comment(self, request, pk=None, comment_id=None):
        """Reply to a comment (students only for specific comment types)"""
        complaint = self.get_object()
        comment = get_object_or_404(ComplaintComment, id=comment_id, complaint=complaint)
        
        # Check if student can reply
        if request.user.role == 'Student' and not comment.allows_student_reply():
            return Response(
                {'error': 'You cannot reply to this type of comment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ComplaintCommentReplySerializer(comment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            
            # Log activity
            ActivityLogger.log_complaint_activity(
                user=request.user,
                complaint=complaint,
                action='reply',
                description=f'Replied to {comment.comment_type.lower()}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            return Response(ComplaintCommentSerializer(comment).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get complaint timeline"""
        complaint = self.get_object()
        timeline_data = self._build_timeline(complaint)
        serializer = ComplaintTimelineSerializer(timeline_data, many=True)
        return Response(serializer.data)
    
    def _build_timeline(self, complaint):
        """Build timeline data for complaint"""
        timeline = []
        
        # Complaint created
        timeline.append({
            'type': 'created',
            'timestamp': complaint.created_at,
            'user': UserBasicSerializer(complaint.created_by).data,
            'title': 'Complaint Created',
            'description': f'Complaint "{complaint.title}" was submitted',
            'icon': 'fas fa-plus-circle',
            'color': 'success'
        })
        
        # Forwards
        for forward in complaint.forwards.all():
            timeline.append({
                'type': 'forwarded',
                'timestamp': forward.timestamp,
                'user': UserBasicSerializer(forward.from_user).data,
                'title': 'Complaint Forwarded',
                'description': f'Forwarded to {forward.to_user.get_full_name()}',
                'icon': 'fas fa-share',
                'color': 'info',
                'data': {'remarks': forward.remarks}
            })
        
        # Comments
        for comment in complaint.comments.all():
            timeline.append({
                'type': 'comment',
                'timestamp': comment.created_at,
                'user': UserBasicSerializer(comment.user).data,
                'title': f'{comment.comment_type} Added',
                'description': comment.text[:100] + ('...' if len(comment.text) > 100 else ''),
                'icon': comment.get_type_icon() if hasattr(comment, 'get_type_icon') else 'fas fa-comment',
                'color': comment.get_type_color(),
                'data': {
                    'comment_type': comment.comment_type,
                    'reply': comment.reply,
                    'replied_at': comment.replied_at
                }
            })
        
        # Responses
        for response in complaint.responses.all():
            timeline.append({
                'type': 'response',
                'timestamp': response.created_at,
                'user': UserBasicSerializer(response.added_by).data,
                'title': 'Official Response',
                'description': response.message[:100] + ('...' if len(response.message) > 100 else ''),
                'icon': 'fas fa-reply',
                'color': 'primary'
            })
        
        # Sort by timestamp
        timeline.sort(key=lambda x: x['timestamp'])
        return timeline


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def track_complaint(request):
    """Track complaint by number (public endpoint)"""
    serializer = ComplaintTrackSerializer(data=request.data)
    if serializer.is_valid():
        complaint_number = serializer.validated_data['complaint_number']
        try:
            complaint = Complaint.objects.get(complaint_number=complaint_number)
            return Response({
                'complaint_number': complaint.complaint_number,
                'title': complaint.title,
                'status': complaint.status,
                'priority': complaint.priority,
                'created_at': complaint.created_at,
                'department': complaint.department.name,
                'can_receive_feedback': complaint.can_receive_feedback()
            })
        except Complaint.DoesNotExist:
            return Response(
                {'error': 'Complaint not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# FEEDBACK VIEWS
# ============================================================================

class ComplaintFeedbackViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for complaint feedback
    """
    serializer_class = ComplaintFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ComplaintFeedback.objects.select_related(
            'complaint', 'submitted_by', 'forwarded_to'
        )
        
        if user.role == 'Student':
            queryset = queryset.filter(submitted_by=user)
        elif user.role in ['Staff', 'DepartmentHead']:
            queryset = queryset.filter(
                Q(forwarded_to=user) | Q(complaint__department=user.department)
            )
        # VC and Admin can see all feedback
        
        return queryset.order_by('-submitted_at')
    
    def perform_create(self, serializer):
        feedback = serializer.save()
        
        # Log activity
        ActivityLogger.log_complaint_activity(
            user=self.request.user,
            complaint=feedback.complaint,
            action='feedback',
            description=f'Submitted feedback with {feedback.rating} stars',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


# ============================================================================
# WITHDRAWAL REQUEST VIEWS
# ============================================================================

class WithdrawalRequestViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for withdrawal requests (private module)
    """
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action in ['review', 'approve', 'reject']:
            return WithdrawalRequestReviewSerializer
        return WithdrawalRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = WithdrawalRequest.objects.select_related(
            'submitted_by', 'reviewed_by'
        )
        
        if user.role == 'Student':
            queryset = queryset.filter(submitted_by=user)
        elif user.role == 'Staff':
            # Staff can only view, not approve
            queryset = queryset.filter(submitted_by__department=user.department)
        elif user.role == 'DepartmentHead':
            queryset = queryset.filter(submitted_by__department=user.department)
        # VC and Admin can see all withdrawal requests
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        withdrawal = serializer.save()
        
        # Log activity
        ActivityLogger.log_withdrawal_activity(
            user=self.request.user,
            withdrawal=withdrawal,
            action='create',
            description=f'Submitted {withdrawal.type} withdrawal request',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Send notifications
        NotificationManager.notify_withdrawal_submitted(withdrawal)
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Review withdrawal request"""
        withdrawal = self.get_object()
        
        # Check permissions
        if request.user.role not in ['DepartmentHead', 'VC', 'Admin']:
            return Response(
                {'error': 'You do not have permission to review withdrawal requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = WithdrawalRequestReviewSerializer(
            withdrawal, data=request.data, context={'request': request}
        )
        
        if serializer.is_valid():
            withdrawal = serializer.save()
            
            # Log activity
            ActivityLogger.log_withdrawal_activity(
                user=request.user,
                withdrawal=withdrawal,
                action='update',
                description=f'Reviewed withdrawal request: {withdrawal.status}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            return Response(WithdrawalRequestSerializer(withdrawal).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# NOTIFICATION VIEWS
# ============================================================================

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only operations for notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return self.request.user.notifications.select_related(
            'related_complaint', 'related_withdrawal'
        ).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """Mark notifications as read"""
        serializer = NotificationMarkReadSerializer(data=request.data)
        if serializer.is_valid():
            notification_ids = serializer.validated_data.get('notification_ids')
            count = NotificationManager.bulk_mark_as_read(request.user, notification_ids)
            return Response({'marked_count': count})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread notification count"""
        count = request.user.notifications.filter(is_read=False).count()
        return Response({'unread_count': count})


# ============================================================================
# ANALYTICS & REPORTING VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_dashboard(request):
    """Get analytics data for dashboard"""
    user = request.user
    
    # Base queryset based on role
    if user.role == 'Student':
        complaints = Complaint.objects.filter(created_by=user)
    elif user.role == 'Staff':
        complaints = Complaint.objects.filter(
            Q(assigned_to=user) | Q(department=user.department)
        )
    elif user.role == 'DepartmentHead':
        complaints = Complaint.objects.filter(department=user.department)
    else:  # VC, Admin
        complaints = Complaint.objects.all()
    
    # Calculate statistics
    total_complaints = complaints.count()
    
    # Complaints by status
    status_counts = complaints.values('status').annotate(count=Count('id'))
    complaints_by_status = {item['status']: item['count'] for item in status_counts}
    
    # Complaints by department
    dept_counts = complaints.values('department__name').annotate(count=Count('id'))
    complaints_by_department = {item['department__name']: item['count'] for item in dept_counts}
    
    # Complaints by priority
    priority_counts = complaints.values('priority').annotate(count=Count('id'))
    complaints_by_priority = {item['priority']: item['count'] for item in priority_counts}
    
    # Resolution rate
    resolved_count = complaints.filter(status__in=['Resolved', 'Closed']).count()
    resolution_rate = (resolved_count / total_complaints * 100) if total_complaints > 0 else 0
    
    # Average resolution time
    resolved_complaints = complaints.filter(
        status__in=['Resolved', 'Closed'],
        resolved_at__isnull=False
    )
    avg_resolution_time = 0
    if resolved_complaints.exists():
        total_time = sum([
            (c.resolved_at - c.created_at).total_seconds() / 3600  # hours
            for c in resolved_complaints
        ])
        avg_resolution_time = total_time / resolved_complaints.count()
    
    # Feedback ratings
    feedback_ratings = {}
    if user.role in ['DepartmentHead', 'VC', 'Admin']:
        ratings = ComplaintFeedback.objects.values('rating').annotate(count=Count('id'))
        feedback_ratings = {f"{item['rating']} stars": item['count'] for item in ratings}
    
    # Monthly trends (last 6 months)
    monthly_trends = {}
    for i in range(6):
        month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=31)
        month_complaints = complaints.filter(
            created_at__gte=month_start,
            created_at__lt=month_end
        ).count()
        monthly_trends[month_start.strftime('%B %Y')] = month_complaints
    
    # Unresolved rate
    unresolved_count = complaints.filter(status__in=['Pending', 'In Progress']).count()
    unresolved_rate = (unresolved_count / total_complaints * 100) if total_complaints > 0 else 0
    
    data = {
        'complaints_by_department': complaints_by_department,
        'complaints_by_status': complaints_by_status,
        'complaints_by_priority': complaints_by_priority,
        'resolution_rate': round(resolution_rate, 2),
        'average_resolution_time': round(avg_resolution_time, 2),
        'feedback_ratings': feedback_ratings,
        'monthly_trends': monthly_trends,
        'top_departments': list(complaints_by_department.items())[:5],
        'recent_activity': [],  # Will be populated by activity logs
        'unresolved_rate': round(unresolved_rate, 2)
    }
    
    serializer = AnalyticsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def complaint_statistics(request):
    """Get detailed complaint statistics"""
    user = request.user
    
    # Base queryset
    if user.role == 'Student':
        complaints = Complaint.objects.filter(created_by=user)
    elif user.role in ['Staff', 'DepartmentHead']:
        complaints = Complaint.objects.filter(department=user.department)
    else:
        complaints = Complaint.objects.all()
    
    # Calculate stats
    total = complaints.count()
    pending = complaints.filter(status='Pending').count()
    in_progress = complaints.filter(status='In Progress').count()
    resolved = complaints.filter(status='Resolved').count()
    rejected = complaints.filter(status='Rejected').count()
    closed = complaints.filter(status='Closed').count()
    
    # Average resolution time
    resolved_complaints = complaints.filter(
        status__in=['Resolved', 'Closed'],
        resolved_at__isnull=False
    )
    avg_time = 0
    if resolved_complaints.exists():
        total_time = sum([
            (c.resolved_at - c.created_at).total_seconds() / 3600
            for c in resolved_complaints
        ])
        avg_time = total_time / resolved_complaints.count()
    
    # Priority distribution
    priority_counts = complaints.values('priority').annotate(count=Count('id'))
    priority_dict = {item['priority']: item['count'] for item in priority_counts}
    
    # Department distribution
    dept_counts = complaints.values('department__name').annotate(count=Count('id'))
    dept_dict = {item['department__name']: item['count'] for item in dept_counts}
    
    # Recent complaints (last 7 days)
    recent = complaints.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).count()
    
    data = {
        'total_complaints': total,
        'pending_complaints': pending,
        'in_progress_complaints': in_progress,
        'resolved_complaints': resolved,
        'rejected_complaints': rejected,
        'closed_complaints': closed,
        'average_resolution_time': round(avg_time, 2),
        'complaints_by_priority': priority_dict,
        'complaints_by_department': dept_dict,
        'recent_complaints': recent
    }
    
    serializer = ComplaintStatsSerializer(data)
    return Response(serializer.data)


# ============================================================================
# ACTIVITY LOG VIEWS
# ============================================================================

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only operations for activity logs
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        user = self.request.user
        queryset = ActivityLog.objects.select_related(
            'user', 'related_complaint', 'related_withdrawal'
        )
        
        # Role-based filtering
        if user.role == 'Student':
            queryset = queryset.filter(user=user)
        elif user.role in ['Staff', 'DepartmentHead']:
            # Can see logs related to their department
            queryset = queryset.filter(
                Q(user=user) |
                Q(related_complaint__department=user.department) |
                Q(related_withdrawal__submitted_by__department=user.department)
            )
        # VC and Admin can see all logs
        
        return queryset.order_by('-timestamp')


# ============================================================================
# UTILITY VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_users_for_forwarding(request):
    """Get list of users for complaint forwarding"""
    # Exclude students from forwarding options
    users = User.objects.filter(
        role__in=['Staff', 'DepartmentHead', 'VC', 'Admin'],
        is_active=True
    ).select_related('department')
    
    serializer = UserBasicSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_departments(request):
    """Get list of active departments"""
    departments = Department.objects.filter(is_active=True)
    serializer = DepartmentBasicSerializer(departments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_complaint_actions(request):
    """Perform bulk actions on complaints"""
    serializer = BulkActionSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        complaint_ids = data['complaint_ids']
        action = data['action']
        
        # Get complaints
        complaints = Complaint.objects.filter(id__in=complaint_ids)
        
        # Check permissions
        user = request.user
        if user.role == 'Student':
            complaints = complaints.filter(created_by=user)
        elif user.role in ['Staff', 'DepartmentHead']:
            complaints = complaints.filter(department=user.department)
        
        updated_count = 0
        
        with transaction.atomic():
            if action == 'assign':
                assigned_to = User.objects.get(id=data['assigned_to'])
                updated_count = complaints.update(assigned_to=assigned_to)
                
            elif action == 'status_change':
                updated_count = complaints.update(status=data['status'])
                
            elif action == 'priority_change':
                updated_count = complaints.update(priority=data['priority'])
                
            elif action == 'department_change':
                department = Department.objects.get(id=data['department'])
                updated_count = complaints.update(department=department)
        
        # Log activity
        ActivityLogger.log_activity(
            user=request.user,
            action='update',
            description=f'Bulk {action} performed on {updated_count} complaints',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        
        return Response({'updated_count': updated_count})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_file(request):
    """Handle file uploads with security validation"""
    serializer = FileUploadSerializer(data=request.data)
    if serializer.is_valid():
        file = serializer.validated_data['file']
        
        # Additional security checks can be added here
        # (virus scanning, content validation, etc.)
        
        # Log activity
        ActivityLogger.log_activity(
            user=request.user,
            action='upload',
            description=f'Uploaded file: {file.name}',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            additional_data={'filename': file.name, 'size': file.size}
        )
        
        return Response({
            'filename': file.name,
            'size': file.size,
            'content_type': file.content_type
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
