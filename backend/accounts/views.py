from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import logout
from django.utils import timezone
from .models import User
from .serializers import (
    UserRegistrationSerializer, CustomTokenObtainPairSerializer,
    UserProfileSerializer, UserListSerializer, PasswordChangeSerializer,
    UserCreateSerializer
)
from .permissions import IsAdminRole, IsOwnerOrReadOnly, CanManageUsers
from core.utils import log_activity


class StudentRegistrationView(generics.CreateAPIView):
    """
    API endpoint for student registration
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        user = serializer.save()
        # Log registration activity
        log_activity(
            user=user,
            action='create',
            description=f'Student registered: {user.username}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view with additional user info
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Update last login IP
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                user.last_login_ip = request.META.get('REMOTE_ADDR')
                user.save(update_fields=['last_login_ip'])
                
                # Log login activity
                log_activity(
                    user=user,
                    action='login',
                    description=f'User logged in: {user.username}',
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )
            except User.DoesNotExist:
                pass
        
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for user profile management
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_object(self):
        return self.request.user
    
    def perform_update(self, serializer):
        user = serializer.save()
        # Log profile update activity
        log_activity(
            user=self.request.user,
            action='update',
            description=f'Profile updated: {user.username}',
            related_item=user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


class PasswordChangeView(generics.GenericAPIView):
    """
    API endpoint for password change
    """
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Log password change activity
            log_activity(
                user=request.user,
                action='update',
                description='Password changed',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating users (admin only)
    """
    queryset = User.objects.all().select_related('department')
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by department
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-date_joined')
    
    def perform_create(self, serializer):
        user = serializer.save()
        # Log user creation activity
        log_activity(
            user=self.request.user,
            action='create',
            description=f'User created: {user.username} ({user.role})',
            related_item=user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for user detail management (admin only)
    """
    queryset = User.objects.all().select_related('department')
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def perform_update(self, serializer):
        user = serializer.save()
        # Log user update activity
        log_activity(
            user=self.request.user,
            action='update',
            description=f'User updated: {user.username}',
            related_item=user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
    
    def perform_destroy(self, instance):
        # Log user deletion activity
        log_activity(
            user=self.request.user,
            action='delete',
            description=f'User deleted: {instance.username}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    API endpoint for user logout
    """
    # Log logout activity
    log_activity(
        user=request.user,
        action='logout',
        description=f'User logged out: {request.user.username}',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )
    
    logout(request)
    return Response({
        'message': 'Successfully logged out'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats_view(request):
    """
    API endpoint for user statistics (admin only)
    """
    if not request.user.can_manage_users():
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    stats = {
        'total_users': User.objects.count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'verified_users': User.objects.filter(is_verified=True).count(),
        'suspended_users': User.objects.filter(is_suspended=True).count(),
        'users_by_role': {
            'students': User.objects.filter(role='Student').count(),
            'staff': User.objects.filter(role='Staff').count(),
            'department_heads': User.objects.filter(role='DepartmentHead').count(),
            'vc': User.objects.filter(role='VC').count(),
            'admins': User.objects.filter(role='Admin').count(),
        },
        'recent_registrations': User.objects.filter(
            date_joined__gte=timezone.now() - timezone.timedelta(days=30)
        ).count(),
    }
    
    return Response(stats)
