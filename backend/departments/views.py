from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from .models import Department
from .serializers import DepartmentSerializer, DepartmentListSerializer, DepartmentStatsSerializer
from accounts.permissions import CanManageUsers, CanViewAnalytics
from core.utils import log_activity


class DepartmentListView(generics.ListAPIView):
    """
    API endpoint for listing departments
    """
    queryset = Department.objects.filter(is_active=True).select_related('head')
    serializer_class = DepartmentListSerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartmentDetailView(generics.RetrieveAPIView):
    """
    API endpoint for department details
    """
    queryset = Department.objects.all().select_related('head')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartmentManageView(generics.ListCreateAPIView):
    """
    API endpoint for managing departments (admin only)
    """
    queryset = Department.objects.all().select_related('head')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def perform_create(self, serializer):
        department = serializer.save()
        # Log department creation activity
        log_activity(
            user=self.request.user,
            action='create',
            description=f'Department created: {department.name}',
            related_item=department,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


class DepartmentManageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for managing individual departments (admin only)
    """
    queryset = Department.objects.all().select_related('head')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def perform_update(self, serializer):
        department = serializer.save()
        # Log department update activity
        log_activity(
            user=self.request.user,
            action='update',
            description=f'Department updated: {department.name}',
            related_item=department,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
    
    def perform_destroy(self, instance):
        # Soft delete by setting is_active to False
        instance.is_active = False
        instance.save()
        
        # Log department deletion activity
        log_activity(
            user=self.request.user,
            action='delete',
            description=f'Department deactivated: {instance.name}',
            related_item=instance,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, CanViewAnalytics])
def department_stats_view(request):
    """
    API endpoint for department statistics
    """
    from complaints.models import Complaint
    from django.utils import timezone
    from datetime import timedelta
    
    # Get departments with complaint statistics
    departments = Department.objects.filter(is_active=True).annotate(
        total_complaints=Count('complaints'),
        pending_complaints=Count('complaints', filter=Q(complaints__status='Pending')),
        resolved_complaints=Count('complaints', filter=Q(complaints__status='Resolved')),
    ).select_related('head')
    
    stats_data = []
    for dept in departments:
        # Calculate average resolution time for resolved complaints
        resolved_complaints = Complaint.objects.filter(
            department=dept,
            status='Resolved',
            resolved_at__isnull=False
        )
        
        avg_resolution_time = 0
        if resolved_complaints.exists():
            total_time = sum([
                (complaint.resolved_at - complaint.created_at).total_seconds() / 3600  # in hours
                for complaint in resolved_complaints
            ])
            avg_resolution_time = total_time / resolved_complaints.count()
        
        stats_data.append({
            'department_id': dept.id,
            'department_name': dept.name,
            'total_complaints': dept.total_complaints,
            'pending_complaints': dept.pending_complaints,
            'resolved_complaints': dept.resolved_complaints,
            'average_resolution_time': round(avg_resolution_time, 2),
            'staff_count': dept.get_staff_count(),
            'student_count': dept.get_student_count(),
        })
    
    serializer = DepartmentStatsSerializer(stats_data, many=True)
    return Response(serializer.data)
