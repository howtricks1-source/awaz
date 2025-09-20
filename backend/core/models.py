from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class ActivityLog(models.Model):
    """
    Model to log all user activities in the system
    """
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('forward', 'Forwarded'),
        ('assign', 'Assigned'),
        ('comment', 'Commented'),
        ('reply', 'Replied'),
        ('approve', 'Approved'),
        ('reject', 'Rejected'),
        ('close', 'Closed'),
        ('reopen', 'Reopened'),
        ('login', 'Logged In'),
        ('logout', 'Logged Out'),
        ('view', 'Viewed'),
        ('download', 'Downloaded'),
        ('upload', 'Uploaded'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    
    # Generic foreign key to relate to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_item = GenericForeignKey('content_type', 'object_id')
    
    # Additional context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    extra_data = models.JSONField(default=dict, blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'activity_logs'
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['content_type', 'object_id']),
        ]
        
    def __str__(self):
        return f"{self.user} {self.action} {self.description} at {self.timestamp}"
    
    def get_action_icon(self):
        """Return icon class for action type"""
        icons = {
            'create': 'fas fa-plus',
            'update': 'fas fa-edit',
            'delete': 'fas fa-trash',
            'forward': 'fas fa-share',
            'assign': 'fas fa-user-check',
            'comment': 'fas fa-comment',
            'reply': 'fas fa-reply',
            'approve': 'fas fa-check',
            'reject': 'fas fa-times',
            'close': 'fas fa-lock',
            'reopen': 'fas fa-unlock',
            'login': 'fas fa-sign-in-alt',
            'logout': 'fas fa-sign-out-alt',
            'view': 'fas fa-eye',
            'download': 'fas fa-download',
            'upload': 'fas fa-upload',
        }
        return icons.get(self.action, 'fas fa-info')
    
    def get_action_color(self):
        """Return color class for action type"""
        colors = {
            'create': 'success',
            'update': 'info',
            'delete': 'danger',
            'forward': 'warning',
            'assign': 'primary',
            'comment': 'secondary',
            'reply': 'info',
            'approve': 'success',
            'reject': 'danger',
            'close': 'dark',
            'reopen': 'warning',
            'login': 'success',
            'logout': 'secondary',
            'view': 'info',
            'download': 'primary',
            'upload': 'success',
        }
        return colors.get(self.action, 'secondary')


class SystemSetting(models.Model):
    """
    Model for system-wide settings and configurations
    """
    SETTING_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
        ('text', 'Text'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=10, choices=SETTING_TYPES, default='string')
    description = models.TextField(blank=True, null=True)
    
    # Metadata
    is_public = models.BooleanField(default=False, help_text="Can be accessed by non-admin users")
    is_editable = models.BooleanField(default=True, help_text="Can be modified through admin interface")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_settings'
    )
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
        ordering = ['key']
        
    def __str__(self):
        return f"{self.key}: {self.value[:50]}..."
    
    def get_typed_value(self):
        """Return value converted to appropriate type"""
        if self.setting_type == 'integer':
            try:
                return int(self.value)
            except ValueError:
                return 0
        elif self.setting_type == 'boolean':
            return self.value.lower() in ['true', '1', 'yes', 'on']
        elif self.setting_type == 'json':
            try:
                import json
                return json.loads(self.value)
            except json.JSONDecodeError:
                return {}
        else:
            return self.value
    
    @classmethod
    def get_setting(cls, key, default=None):
        """Get setting value by key"""
        try:
            setting = cls.objects.get(key=key)
            return setting.get_typed_value()
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_setting(cls, key, value, setting_type='string', user=None):
        """Set setting value by key"""
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={
                'value': str(value),
                'setting_type': setting_type,
                'updated_by': user
            }
        )
        if not created:
            setting.value = str(value)
            setting.setting_type = setting_type
            setting.updated_by = user
            setting.save()
        return setting
