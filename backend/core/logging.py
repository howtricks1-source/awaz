"""
Core logging utilities for activity tracking and audit trails
"""
from django.contrib.auth import get_user_model
from complaints.models import ActivityLog, Notification
from django.utils import timezone
import json

User = get_user_model()


class ActivityLogger:
    """
    Centralized activity logging system
    """
    
    @staticmethod
    def log_activity(user, action, description, **kwargs):
        """
        Log user activity with optional related objects
        
        Args:
            user: User instance
            action: Action type (from ActivityLog.ACTION_TYPES)
            description: Human-readable description
            **kwargs: Additional context (complaint, withdrawal, ip_address, etc.)
        """
        try:
            ActivityLog.objects.create(
                user=user,
                action=action,
                description=description,
                related_complaint=kwargs.get('complaint'),
                related_withdrawal=kwargs.get('withdrawal'),
                ip_address=kwargs.get('ip_address'),
                user_agent=kwargs.get('user_agent'),
                additional_data=kwargs.get('additional_data', {})
            )
        except Exception as e:
            # Log the error but don't break the main flow
            print(f"Activity logging failed: {e}")
    
    @staticmethod
    def log_complaint_activity(user, complaint, action, description, **kwargs):
        """
        Log complaint-specific activity
        """
        ActivityLogger.log_activity(
            user=user,
            action=action,
            description=description,
            complaint=complaint,
            **kwargs
        )
    
    @staticmethod
    def log_withdrawal_activity(user, withdrawal, action, description, **kwargs):
        """
        Log withdrawal-specific activity
        """
        ActivityLogger.log_activity(
            user=user,
            action=action,
            description=description,
            withdrawal=withdrawal,
            **kwargs
        )
    
    @staticmethod
    def log_auth_activity(user, action, request=None):
        """
        Log authentication-related activity
        """
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        description = f"User {action}"
        if action == 'login':
            description = f"User {user.username} logged in"
        elif action == 'logout':
            description = f"User {user.username} logged out"
        
        ActivityLogger.log_activity(
            user=user,
            action=action,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent
        )


class NotificationManager:
    """
    Centralized notification management system
    """
    
    @staticmethod
    def create_notification(recipient, notification_type, title, message, **kwargs):
        """
        Create a new notification
        
        Args:
            recipient: User instance
            notification_type: Type from Notification.NOTIFICATION_TYPES
            title: Notification title
            message: Notification message
            **kwargs: Additional context (link, complaint, withdrawal)
        """
        try:
            notification = Notification.objects.create(
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                link=kwargs.get('link'),
                related_complaint=kwargs.get('complaint'),
                related_withdrawal=kwargs.get('withdrawal')
            )
            return notification
        except Exception as e:
            print(f"Notification creation failed: {e}")
            return None
    
    @staticmethod
    def notify_complaint_created(complaint):
        """
        Send notifications when a new complaint is created
        """
        # Notify department head
        if complaint.department.head:
            NotificationManager.create_notification(
                recipient=complaint.department.head,
                notification_type='new_complaint',
                title=f'New Complaint: {complaint.complaint_number}',
                message=f'A new complaint "{complaint.title}" has been submitted by {complaint.created_by.get_full_name()}',
                link=f'/complaints/{complaint.id}/',
                complaint=complaint
            )
        
        # Notify all staff in the department
        staff_users = User.objects.filter(
            department=complaint.department,
            role__in=['Staff', 'DepartmentHead']
        ).exclude(id=complaint.created_by.id)
        
        for staff in staff_users:
            NotificationManager.create_notification(
                recipient=staff,
                notification_type='new_complaint',
                title=f'New Complaint in {complaint.department.name}',
                message=f'Complaint "{complaint.title}" requires attention',
                link=f'/complaints/{complaint.id}/',
                complaint=complaint
            )
    
    @staticmethod
    def notify_complaint_forwarded(complaint, from_user, to_user, remarks=None):
        """
        Send notification when complaint is forwarded
        """
        message = f'Complaint "{complaint.title}" has been forwarded to you by {from_user.get_full_name()}'
        if remarks:
            message += f'\n\nRemarks: {remarks}'
        
        NotificationManager.create_notification(
            recipient=to_user,
            notification_type='complaint_forwarded',
            title=f'Complaint Forwarded: {complaint.complaint_number}',
            message=message,
            link=f'/complaints/{complaint.id}/',
            complaint=complaint
        )
    
    @staticmethod
    def notify_comment_added(complaint, comment):
        """
        Send notification when comment is added
        """
        # Notify complaint creator if comment requires reply
        if comment.allows_student_reply() and complaint.created_by != comment.user:
            notification_type = 'reply_required' if comment.comment_type in ['Require Info', 'Ask'] else 'comment_added'
            
            NotificationManager.create_notification(
                recipient=complaint.created_by,
                notification_type=notification_type,
                title=f'New {comment.comment_type}: {complaint.complaint_number}',
                message=f'{comment.user.get_full_name()} added a {comment.comment_type.lower()}: "{comment.text[:100]}..."',
                link=f'/complaints/{complaint.id}/',
                complaint=complaint
            )
    
    @staticmethod
    def notify_status_changed(complaint, old_status, new_status, changed_by):
        """
        Send notification when complaint status changes
        """
        NotificationManager.create_notification(
            recipient=complaint.created_by,
            notification_type='status_changed',
            title=f'Status Updated: {complaint.complaint_number}',
            message=f'Your complaint status has been changed from "{old_status}" to "{new_status}" by {changed_by.get_full_name()}',
            link=f'/complaints/{complaint.id}/',
            complaint=complaint
        )
        
        # If complaint is resolved/closed, notify about feedback opportunity
        if new_status in ['Resolved', 'Closed']:
            NotificationManager.create_notification(
                recipient=complaint.created_by,
                notification_type='feedback_requested',
                title=f'Feedback Requested: {complaint.complaint_number}',
                message=f'Your complaint has been {new_status.lower()}. Please provide feedback on the resolution.',
                link=f'/complaints/{complaint.id}/feedback/',
                complaint=complaint
            )
    
    @staticmethod
    def notify_withdrawal_submitted(withdrawal):
        """
        Send notification when withdrawal request is submitted
        """
        # Notify department head and VC
        recipients = []
        
        if withdrawal.submitted_by.department.head:
            recipients.append(withdrawal.submitted_by.department.head)
        
        # Add VC users
        vc_users = User.objects.filter(role='VC')
        recipients.extend(vc_users)
        
        for recipient in recipients:
            NotificationManager.create_notification(
                recipient=recipient,
                notification_type='withdrawal_submitted',
                title=f'Withdrawal Request: {withdrawal.request_number}',
                message=f'{withdrawal.submitted_by.get_full_name()} has submitted a {withdrawal.type} withdrawal request',
                link=f'/withdrawals/{withdrawal.id}/',
                withdrawal=withdrawal
            )
    
    @staticmethod
    def notify_approval_needed(withdrawal, approver):
        """
        Send notification when approval is needed
        """
        NotificationManager.create_notification(
            recipient=approver,
            notification_type='approval_needed',
            title=f'Approval Required: {withdrawal.request_number}',
            message=f'Withdrawal request from {withdrawal.submitted_by.get_full_name()} requires your approval',
            link=f'/withdrawals/{withdrawal.id}/',
            withdrawal=withdrawal
        )
    
    @staticmethod
    def bulk_mark_as_read(user, notification_ids=None):
        """
        Mark multiple notifications as read
        """
        queryset = user.notifications.filter(is_read=False)
        
        if notification_ids:
            queryset = queryset.filter(id__in=notification_ids)
        
        queryset.update(is_read=True, read_at=timezone.now())
        return queryset.count()


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_activity_decorator(action, description_template=None):
    """
    Decorator to automatically log activity for view functions
    
    Usage:
        @log_activity_decorator('view', 'User viewed {object}')
        def my_view(request, pk):
            ...
    """
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            result = func(request, *args, **kwargs)
            
            if hasattr(request, 'user') and request.user.is_authenticated:
                description = description_template or f"User performed {action}"
                
                # Try to format description with context
                try:
                    if hasattr(result, 'context_data'):
                        description = description.format(**result.context_data)
                except:
                    pass
                
                ActivityLogger.log_activity(
                    user=request.user,
                    action=action,
                    description=description,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            
            return result
        return wrapper
    return decorator
