from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Custom User model extending AbstractUser with role-based access
    """
    ROLE_CHOICES = [
        ('Student', 'Student'),
        ('Staff', 'Staff'),
        ('DepartmentHead', 'Department Head'),
        ('VC', 'Vice Chancellor'),
        ('Admin', 'Admin'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Student')
    department = models.ForeignKey(
        'departments.Department', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    
    # Profile Information
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")],
        blank=True,
        null=True
    )
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    employee_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    
    # Status
    is_verified = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    def can_forward_complaints(self):
        """Check if user can forward complaints"""
        return self.role in ['Staff', 'DepartmentHead', 'VC', 'Admin']
    
    def can_assign_complaints(self):
        """Check if user can assign complaints to others"""
        return self.role in ['DepartmentHead', 'VC', 'Admin']
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role in ['Admin']
    
    def can_view_analytics(self):
        """Check if user can view analytics"""
        return self.role in ['DepartmentHead', 'VC', 'Admin']
