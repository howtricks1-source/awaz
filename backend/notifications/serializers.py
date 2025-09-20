from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notifications
    """
    type_icon = serializers.CharField(source='get_type_icon', read_only=True)
    type_color = serializers.CharField(source='get_type_color', read_only=True)
    time_since = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'link',
            'is_read', 'is_important', 'created_at', 'read_at',
            'type_icon', 'type_color', 'time_since'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
    
    def get_time_since(self, obj):
        """Get human-readable time since notification was created"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        else:
            return obj.created_at.strftime("%b %d, %Y")


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for notification listing
    """
    type_icon = serializers.CharField(source='get_type_icon', read_only=True)
    type_color = serializers.CharField(source='get_type_color', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'is_read', 'is_important', 'created_at',
            'type_icon', 'type_color'
        ]


class NotificationMarkReadSerializer(serializers.Serializer):
    """
    Serializer for marking notifications as read
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )

