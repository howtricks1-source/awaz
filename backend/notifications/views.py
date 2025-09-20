from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Notification
from .serializers import (
    NotificationSerializer, NotificationListSerializer, NotificationMarkReadSerializer
)
from core.utils import log_activity


class NotificationListView(generics.ListAPIView):
    """
    API endpoint for listing user notifications
    """
    serializer_class = NotificationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by importance
        is_important = self.request.query_params.get('is_important')
        if is_important is not None:
            queryset = queryset.filter(is_important=is_important.lower() == 'true')
        
        # Filter by type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset.order_by('-created_at')


class NotificationDetailView(generics.RetrieveAPIView):
    """
    API endpoint for notification details
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Mark as read when viewed
        if not instance.is_read:
            instance.mark_as_read()
            
            # Log activity
            log_activity(
                user=request.user,
                action='view',
                description=f'Notification viewed: {instance.title}',
                related_item=instance,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_read_view(request):
    """
    API endpoint for marking multiple notifications as read
    """
    serializer = NotificationMarkReadSerializer(data=request.data)
    if serializer.is_valid():
        notification_ids = serializer.validated_data['notification_ids']
        
        # Get user's notifications
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user,
            is_read=False
        )
        
        # Mark as read
        updated_count = 0
        for notification in notifications:
            notification.mark_as_read()
            updated_count += 1
        
        # Log activity
        if updated_count > 0:
            log_activity(
                user=request.user,
                action='update',
                description=f'Marked {updated_count} notifications as read',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        
        return Response({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read_view(request):
    """
    API endpoint for marking all notifications as read
    """
    unread_notifications = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    )
    
    updated_count = 0
    for notification in unread_notifications:
        notification.mark_as_read()
        updated_count += 1
    
    # Log activity
    if updated_count > 0:
        log_activity(
            user=request.user,
            action='update',
            description=f'Marked all {updated_count} notifications as read',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
    
    return Response({
        'message': f'All {updated_count} notifications marked as read',
        'updated_count': updated_count
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_stats_view(request):
    """
    API endpoint for notification statistics
    """
    user_notifications = Notification.objects.filter(recipient=request.user)
    
    stats = {
        'total_notifications': user_notifications.count(),
        'unread_notifications': user_notifications.filter(is_read=False).count(),
        'important_notifications': user_notifications.filter(is_important=True).count(),
        'unread_important': user_notifications.filter(is_read=False, is_important=True).count(),
        'notifications_by_type': {}
    }
    
    # Count by type
    type_counts = user_notifications.values('notification_type').annotate(
        count=models.Count('id')
    ).order_by('-count')
    
    for item in type_counts:
        stats['notifications_by_type'][item['notification_type']] = item['count']
    
    return Response(stats)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_notification_view(request, notification_id):
    """
    API endpoint for deleting a notification
    """
    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )
    
    # Log activity
    log_activity(
        user=request.user,
        action='delete',
        description=f'Notification deleted: {notification.title}',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )
    
    notification.delete()
    
    return Response({
        'message': 'Notification deleted successfully'
    }, status=status.HTTP_204_NO_CONTENT)
