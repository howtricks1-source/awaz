from django.db import models
from django.conf import settings


class Department(models.Model):
    """
    Department model for organizing users and complaints
    """
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, null=True)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_department',
        limit_choices_to={'role': 'DepartmentHead'}
    )
    
    # Contact Information
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']
        
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def get_staff_count(self):
        """Get count of staff members in this department"""
        return self.users.filter(role__in=['Staff', 'DepartmentHead']).count()
    
    def get_student_count(self):
        """Get count of students in this department"""
        return self.users.filter(role='Student').count()
    
    def get_active_complaints_count(self):
        """Get count of active complaints for this department"""
        return self.complaints.exclude(status__in=['Resolved', 'Closed', 'Rejected']).count()
