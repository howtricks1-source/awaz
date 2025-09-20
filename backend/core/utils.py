from django.contrib.contenttypes.models import ContentType
from .models import ActivityLog
from notifications.models import Notification


def log_activity(user, action, description, related_item=None, ip_address=None, user_agent=None, extra_data=None):
    """
    Utility function to log user activities
    """
    activity_data = {
        'user': user,
        'action': action,
        'description': description,
        'ip_address': ip_address,
        'user_agent': user_agent,
        'extra_data': extra_data or {}
    }
    
    if related_item:
        activity_data['content_type'] = ContentType.objects.get_for_model(related_item)
        activity_data['object_id'] = related_item.pk
    
    return ActivityLog.objects.create(**activity_data)


def create_notification(recipient, title, message, notification_type, link=None, 
                       related_complaint=None, related_withdrawal=None, is_important=False):
    """
    Utility function to create notifications
    """
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
        related_complaint=related_complaint,
        related_withdrawal=related_withdrawal,
        is_important=is_important
    )


def notify_complaint_created(complaint):
    """
    Send notifications when a complaint is created
    """
    # Notify department head
    if complaint.department.head:
        create_notification(
            recipient=complaint.department.head,
            title=f"New Complaint: {complaint.complaint_number}",
            message=f"A new complaint has been filed in {complaint.department.name} department.",
            notification_type='complaint_created',
            related_complaint=complaint,
            link=f"/complaints/{complaint.id}/",
            is_important=True
        )
    
    # Notify VC and Admins
    from accounts.models import User
    vc_and_admins = User.objects.filter(role__in=['VC', 'Admin'], is_active=True)
    for user in vc_and_admins:
        create_notification(
            recipient=user,
            title=f"New Complaint: {complaint.complaint_number}",
            message=f"A new complaint has been filed by {complaint.created_by.get_full_name()}.",
            notification_type='complaint_created',
            related_complaint=complaint,
            link=f"/complaints/{complaint.id}/"
        )


def notify_complaint_assigned(complaint, assigned_by):
    """
    Send notification when a complaint is assigned
    """
    if complaint.assigned_to:
        create_notification(
            recipient=complaint.assigned_to,
            title=f"Complaint Assigned: {complaint.complaint_number}",
            message=f"You have been assigned a complaint by {assigned_by.get_full_name()}.",
            notification_type='complaint_assigned',
            related_complaint=complaint,
            link=f"/complaints/{complaint.id}/",
            is_important=True
        )


def notify_complaint_forwarded(complaint, from_user, to_user):
    """
    Send notification when a complaint is forwarded
    """
    create_notification(
        recipient=to_user,
        title=f"Complaint Forwarded: {complaint.complaint_number}",
        message=f"A complaint has been forwarded to you by {from_user.get_full_name()}.",
        notification_type='complaint_forwarded',
        related_complaint=complaint,
        link=f"/complaints/{complaint.id}/",
        is_important=True
    )
    
    # Notify complaint creator
    create_notification(
        recipient=complaint.created_by,
        title=f"Complaint Forwarded: {complaint.complaint_number}",
        message=f"Your complaint has been forwarded to {to_user.get_full_name()}.",
        notification_type='complaint_forwarded',
        related_complaint=complaint,
        link=f"/complaints/{complaint.id}/"
    )


def notify_complaint_commented(complaint, comment):
    """
    Send notification when a comment is added to a complaint
    """
    # Notify complaint creator if they're not the commenter
    if complaint.created_by != comment.user:
        create_notification(
            recipient=complaint.created_by,
            title=f"New Comment: {complaint.complaint_number}",
            message=f"{comment.user.get_full_name()} added a {comment.comment_type.lower()} to your complaint.",
            notification_type='complaint_commented',
            related_complaint=complaint,
            link=f"/complaints/{complaint.id}/",
            is_important=comment.comment_type in ['Require Info', 'Ask']
        )
    
    # Notify assigned user if they're not the commenter
    if complaint.assigned_to and complaint.assigned_to != comment.user:
        create_notification(
            recipient=complaint.assigned_to,
            title=f"New Comment: {complaint.complaint_number}",
            message=f"{comment.user.get_full_name()} added a {comment.comment_type.lower()} to the assigned complaint.",
            notification_type='complaint_commented',
            related_complaint=complaint,
            link=f"/complaints/{complaint.id}/"
        )


def notify_complaint_replied(complaint, comment):
    """
    Send notification when a student replies to a comment
    """
    # Notify the comment author
    create_notification(
        recipient=comment.user,
        title=f"Reply Received: {complaint.complaint_number}",
        message=f"{complaint.created_by.get_full_name()} replied to your {comment.comment_type.lower()}.",
        notification_type='complaint_replied',
        related_complaint=complaint,
        link=f"/complaints/{complaint.id}/",
        is_important=True
    )


def notify_complaint_status_changed(complaint, changed_by):
    """
    Send notification when complaint status changes
    """
    create_notification(
        recipient=complaint.created_by,
        title=f"Status Updated: {complaint.complaint_number}",
        message=f"Your complaint status has been changed to '{complaint.status}' by {changed_by.get_full_name()}.",
        notification_type='complaint_status_changed',
        related_complaint=complaint,
        link=f"/complaints/{complaint.id}/",
        is_important=complaint.status in ['Resolved', 'Rejected', 'Closed']
    )


def notify_withdrawal_submitted(withdrawal_request):
    """
    Send notification when a withdrawal request is submitted
    """
    from accounts.models import User
    
    # Notify department head
    if withdrawal_request.submitted_by.department and withdrawal_request.submitted_by.department.head:
        create_notification(
            recipient=withdrawal_request.submitted_by.department.head,
            title=f"New Withdrawal Request: {withdrawal_request.request_number}",
            message=f"A new {withdrawal_request.type.lower()} withdrawal request has been submitted.",
            notification_type='withdrawal_submitted',
            related_withdrawal=withdrawal_request,
            link=f"/withdrawals/{withdrawal_request.id}/",
            is_important=True
        )
    
    # Notify VC and Admins
    vc_and_admins = User.objects.filter(role__in=['VC', 'Admin'], is_active=True)
    for user in vc_and_admins:
        create_notification(
            recipient=user,
            title=f"New Withdrawal Request: {withdrawal_request.request_number}",
            message=f"A new withdrawal request has been submitted by {withdrawal_request.submitted_by.get_full_name()}.",
            notification_type='withdrawal_submitted',
            related_withdrawal=withdrawal_request,
            link=f"/withdrawals/{withdrawal_request.id}/"
        )


def notify_withdrawal_reviewed(withdrawal_request):
    """
    Send notification when a withdrawal request is reviewed
    """
    create_notification(
        recipient=withdrawal_request.submitted_by,
        title=f"Withdrawal Request {withdrawal_request.status}: {withdrawal_request.request_number}",
        message=f"Your {withdrawal_request.type.lower()} withdrawal request has been {withdrawal_request.status.lower()}.",
        notification_type='withdrawal_reviewed',
        related_withdrawal=withdrawal_request,
        link=f"/withdrawals/{withdrawal_request.id}/",
        is_important=True
    )


def notify_feedback_submitted(feedback):
    """
    Send notification when feedback is submitted
    """
    if feedback.forwarded_to:
        create_notification(
            recipient=feedback.forwarded_to,
            title=f"Feedback Received: {feedback.complaint.complaint_number}",
            message=f"Feedback has been submitted for complaint {feedback.complaint.complaint_number} with {feedback.rating} stars.",
            notification_type='feedback_submitted',
            related_complaint=feedback.complaint,
            link=f"/complaints/{feedback.complaint.id}/feedback/"
        )


def get_user_dashboard_stats(user):
    """
    Get dashboard statistics for a user based on their role
    """
    from complaints.models import Complaint, WithdrawalRequest
    from django.db.models import Count, Q
    
    stats = {}
    
    if user.role == 'Student':
        stats = {
            'my_complaints': Complaint.objects.filter(created_by=user).count(),
            'pending_complaints': Complaint.objects.filter(created_by=user, status='Pending').count(),
            'resolved_complaints': Complaint.objects.filter(created_by=user, status='Resolved').count(),
            'my_withdrawals': WithdrawalRequest.objects.filter(submitted_by=user).count(),
            'unread_notifications': user.notifications.filter(is_read=False).count(),
        }
    
    elif user.role == 'Staff':
        stats = {
            'assigned_complaints': Complaint.objects.filter(assigned_to=user).count(),
            'pending_assigned': Complaint.objects.filter(assigned_to=user, status='Pending').count(),
            'in_progress_assigned': Complaint.objects.filter(assigned_to=user, status='In Progress').count(),
            'unread_notifications': user.notifications.filter(is_read=False).count(),
        }
    
    elif user.role == 'DepartmentHead':
        dept_complaints = Complaint.objects.filter(department=user.department) if user.department else Complaint.objects.none()
        stats = {
            'department_complaints': dept_complaints.count(),
            'pending_complaints': dept_complaints.filter(status='Pending').count(),
            'unresolved_complaints': dept_complaints.exclude(status__in=['Resolved', 'Closed']).count(),
            'department_withdrawals': WithdrawalRequest.objects.filter(
                submitted_by__department=user.department
            ).count() if user.department else 0,
            'unread_notifications': user.notifications.filter(is_read=False).count(),
        }
    
    elif user.role in ['VC', 'Admin']:
        stats = {
            'total_complaints': Complaint.objects.count(),
            'pending_complaints': Complaint.objects.filter(status='Pending').count(),
            'unresolved_complaints': Complaint.objects.exclude(status__in=['Resolved', 'Closed']).count(),
            'total_withdrawals': WithdrawalRequest.objects.count(),
            'pending_withdrawals': WithdrawalRequest.objects.filter(status='Pending').count(),
            'unread_notifications': user.notifications.filter(is_read=False).count(),
        }
    
    return stats


def get_complaint_timeline(complaint):
    """
    Get timeline of events for a complaint
    """
    timeline = []
    
    # Creation
    timeline.append({
        'type': 'created',
        'timestamp': complaint.created_at,
        'user': complaint.created_by,
        'description': 'Complaint created',
        'icon': 'fas fa-plus-circle',
        'color': 'success'
    })
    
    # Forwards
    for forward in complaint.forwards.all():
        timeline.append({
            'type': 'forwarded',
            'timestamp': forward.timestamp,
            'user': forward.from_user,
            'description': f'Forwarded to {forward.to_user.get_full_name()}',
            'remarks': forward.remarks,
            'icon': 'fas fa-share',
            'color': 'warning'
        })
    
    # Responses
    for response in complaint.responses.all():
        timeline.append({
            'type': 'response',
            'timestamp': response.created_at,
            'user': response.added_by,
            'description': 'Official response added',
            'message': response.message,
            'attachment': response.attachment,
            'icon': 'fas fa-reply',
            'color': 'info'
        })
    
    # Comments
    for comment in complaint.comments.all():
        timeline.append({
            'type': 'comment',
            'timestamp': comment.created_at,
            'user': comment.user,
            'description': f'{comment.comment_type} added',
            'message': comment.text,
            'reply': comment.reply,
            'replied_at': comment.replied_at,
            'icon': 'fas fa-comment',
            'color': comment.get_type_color()
        })
    
    # Status changes (would need to track these separately in a real system)
    if complaint.resolved_at:
        timeline.append({
            'type': 'resolved',
            'timestamp': complaint.resolved_at,
            'description': 'Complaint resolved',
            'icon': 'fas fa-check-circle',
            'color': 'success'
        })
    
    if complaint.closed_at:
        timeline.append({
            'type': 'closed',
            'timestamp': complaint.closed_at,
            'description': 'Complaint closed',
            'icon': 'fas fa-lock',
            'color': 'dark'
        })
    
    # Sort by timestamp
    timeline.sort(key=lambda x: x['timestamp'])
    
    return timeline

