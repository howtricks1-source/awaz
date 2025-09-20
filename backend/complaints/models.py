from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import datetime
import uuid


def generate_complaint_number():
    """Generate unique complaint number in format AWA-YYYY-XXXX"""
    year = datetime.now().year
    # Get the last complaint number for this year
    last_complaint = Complaint.objects.filter(
        complaint_number__startswith=f'AWA-{year}-'
    ).order_by('-complaint_number').first()
    
    if last_complaint:
        last_number = int(last_complaint.complaint_number.split('-')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f'AWA-{year}-{new_number:04d}'


def generate_withdrawal_number():
    """Generate unique withdrawal request number in format WRQ-YYYY-XXXX"""
    year = datetime.now().year
    # Get the last withdrawal number for this year
    last_withdrawal = WithdrawalRequest.objects.filter(
        request_number__startswith=f'WRQ-{year}-'
    ).order_by('-request_number').first()
    
    if last_withdrawal:
        last_number = int(last_withdrawal.request_number.split('-')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f'WRQ-{year}-{new_number:04d}'


class Complaint(models.Model):
    """
    Main complaint model with auto-generated complaint numbers
    """
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
        ('Rejected', 'Rejected'),
        ('Not Resolved', 'Not Resolved'),
        ('Closed', 'Closed'),
    ]
    
    complaint_number = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    # Relationships
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_complaints'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints'
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.CASCADE,
        related_name='complaints'
    )
    
    # File attachment
    attachment = models.FileField(upload_to='complaint_attachments/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional fields
    is_anonymous = models.BooleanField(default=False)
    is_urgent = models.BooleanField(default=False)
    expected_resolution_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'complaints'
        verbose_name = 'Complaint'
        verbose_name_plural = 'Complaints'
        ordering = ['-created_at']
        
    def save(self, *args, **kwargs):
        if not self.complaint_number:
            self.complaint_number = generate_complaint_number()
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.complaint_number} - {self.title}"
    
    def get_status_color(self):
        """Return color code for status"""
        colors = {
            'Pending': 'warning',
            'In Progress': 'info',
            'Resolved': 'success',
            'Rejected': 'danger',
            'Not Resolved': 'secondary',
            'Closed': 'dark',
        }
        return colors.get(self.status, 'secondary')
    
    def get_priority_color(self):
        """Return color code for priority"""
        colors = {
            'Low': 'success',
            'Medium': 'warning',
            'High': 'danger',
            'Critical': 'dark',
        }
        return colors.get(self.priority, 'secondary')
    
    def can_be_forwarded(self):
        """Check if complaint can be forwarded"""
        return self.status not in ['Resolved', 'Closed', 'Rejected']
    
    def can_receive_feedback(self):
        """Check if complaint can receive feedback"""
        return self.status in ['Resolved', 'Closed']


class ComplaintForward(models.Model):
    """
    Model to track complaint forwarding history
    """
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='forwards'
    )
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='forwarded_complaints'
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_complaints'
    )
    remarks = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'complaint_forwards'
        verbose_name = 'Complaint Forward'
        verbose_name_plural = 'Complaint Forwards'
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.complaint.complaint_number} forwarded from {self.from_user} to {self.to_user}"


class ComplaintResponse(models.Model):
    """
    Model for official responses to complaints
    """
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    message = models.TextField()
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaint_responses'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    # File attachment for response
    attachment = models.FileField(upload_to='response_attachments/', blank=True, null=True)
    
    class Meta:
        db_table = 'complaint_responses'
        verbose_name = 'Complaint Response'
        verbose_name_plural = 'Complaint Responses'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Response to {self.complaint.complaint_number} by {self.added_by}"


class ComplaintComment(models.Model):
    """
    Model for comments on complaints with different types
    """
    COMMENT_TYPE_CHOICES = [
        ('Comment', 'Comment'),
        ('Require Info', 'Require Info'),
        ('Ask', 'Ask'),
    ]
    
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaint_comments'
    )
    comment_type = models.CharField(max_length=20, choices=COMMENT_TYPE_CHOICES, default='Comment')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Reply functionality
    reply = models.TextField(blank=True, null=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'complaint_comments'
        verbose_name = 'Complaint Comment'
        verbose_name_plural = 'Complaint Comments'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.comment_type} on {self.complaint.complaint_number} by {self.user}"
    
    def get_type_color(self):
        """Return color code for comment type"""
        colors = {
            'Comment': 'primary',
            'Require Info': 'warning',
            'Ask': 'info',
        }
        return colors.get(self.comment_type, 'secondary')
    
    def allows_student_reply(self):
        """Check if student can reply to this comment"""
        return self.comment_type in ['Require Info', 'Ask']


class ComplaintFeedback(models.Model):
    """
    Model for post-closure feedback on complaints
    """
    complaint = models.OneToOneField(
        Complaint,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    feedback_text = models.TextField()
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_feedback'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    forwarded_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_feedback'
    )
    
    class Meta:
        db_table = 'complaint_feedback'
        verbose_name = 'Complaint Feedback'
        verbose_name_plural = 'Complaint Feedback'
        ordering = ['-submitted_at']
        
    def __str__(self):
        return f"Feedback for {self.complaint.complaint_number} - {self.rating} stars"
    
    def get_rating_stars(self):
        """Return star representation of rating"""
        return '★' * self.rating + '☆' * (5 - self.rating)


class WithdrawalRequest(models.Model):
    """
    Model for withdrawal requests (private module)
    """
    TYPE_CHOICES = [
        ('Course', 'Course Withdrawal'),
        ('Semester', 'Semester Withdrawal'),
        ('Program', 'Program Withdrawal'),
        ('Leave', 'Leave of Absence'),
        ('Transfer', 'Transfer Request'),
    ]
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Under Review', 'Under Review'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Cancelled', 'Cancelled'),
    ]
    
    request_number = models.CharField(max_length=20, unique=True, editable=False)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    # Relationships
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='withdrawal_requests'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_withdrawals'
    )
    
    # Response
    response = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional fields
    effective_date = models.DateField(null=True, blank=True)
    supporting_documents = models.FileField(upload_to='withdrawal_documents/', blank=True, null=True)
    
    class Meta:
        db_table = 'withdrawal_requests'
        verbose_name = 'Withdrawal Request'
        verbose_name_plural = 'Withdrawal Requests'
        ordering = ['-created_at']
        
    def save(self, *args, **kwargs):
        if not self.request_number:
            self.request_number = generate_withdrawal_number()
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.request_number} - {self.type} by {self.submitted_by}"
    
    def get_status_color(self):
        """Return color code for status"""
        colors = {
            'Pending': 'warning',
            'Under Review': 'info',
            'Approved': 'success',
            'Rejected': 'danger',
            'Cancelled': 'secondary',
        }
        return colors.get(self.status, 'secondary')
