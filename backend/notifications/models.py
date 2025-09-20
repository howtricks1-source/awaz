from django.db import models
from django.conf import settings


class Notification(models.Model):
    """
    Model for user notifications
    """
    NOTIFICATION_TYPES = [
        ('complaint_created', 'Complaint Created'),
        ('complaint_assigned', 'Complaint Assigned'),
        ('complaint_forwarded', 'Complaint Forwarded'),
        ('complaint_commented', 'Complaint Commented'),
        ('complaint_replied', 'Complaint Replied'),
        ('complaint_status_changed', 'Complaint Status Changed'),
        ('withdrawal_submitted', 'Withdrawal Request Submitted'),
        ('withdrawal_reviewed', 'Withdrawal Request Reviewed'),
        ('feedback_submitted', 'Feedback Submitted'),
        ('system_announcement', 'System Announcement'),
    ]
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    link = models.URLField(blank=True, null=True, help_text="Link to related resource")
    
    # Status
    is_read = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Related objects (generic foreign key would be better, but keeping simple)
    related_complaint = models.ForeignKey(
        'complaints.Complaint',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    related_withdrawal = models.ForeignKey(
        'complaints.WithdrawalRequest',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Notification for {self.recipient}: {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            from django.utils import timezone
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def get_type_icon(self):
        """Return icon class for notification type"""
        icons = {
            'complaint_created': 'fas fa-plus-circle',
            'complaint_assigned': 'fas fa-user-check',
            'complaint_forwarded': 'fas fa-share',
            'complaint_commented': 'fas fa-comment',
            'complaint_replied': 'fas fa-reply',
            'complaint_status_changed': 'fas fa-sync-alt',
            'withdrawal_submitted': 'fas fa-file-alt',
            'withdrawal_reviewed': 'fas fa-check-circle',
            'feedback_submitted': 'fas fa-star',
            'system_announcement': 'fas fa-bullhorn',
        }
        return icons.get(self.notification_type, 'fas fa-bell')
    
    def get_type_color(self):
        """Return color class for notification type"""
        colors = {
            'complaint_created': 'primary',
            'complaint_assigned': 'info',
            'complaint_forwarded': 'warning',
            'complaint_commented': 'secondary',
            'complaint_replied': 'success',
            'complaint_status_changed': 'info',
            'withdrawal_submitted': 'warning',
            'withdrawal_reviewed': 'success',
            'feedback_submitted': 'success',
            'system_announcement': 'danger',
        }
        return colors.get(self.notification_type, 'secondary')
