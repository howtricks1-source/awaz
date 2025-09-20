"""
URL configuration for hamari_awaz project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.utils import get_user_dashboard_stats


@api_view(['GET'])
def api_root(request):
    """
    API root endpoint with available endpoints
    """
    if request.user.is_authenticated:
        dashboard_stats = get_user_dashboard_stats(request.user)
        return Response({
            'message': f'Welcome to Hamari Awaz API, {request.user.get_full_name()}!',
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'role': request.user.role,
                'department': request.user.department.name if request.user.department else None,
            },
            'dashboard_stats': dashboard_stats,
            'endpoints': {
                'auth': '/api/auth/',
                'departments': '/api/departments/',
                'complaints': '/api/complaints/',
                'notifications': '/api/notifications/',
                'admin': '/admin/',
            }
        })
    else:
        return Response({
            'message': 'Welcome to Hamari Awaz API',
            'description': 'A comprehensive complaint management system for educational institutions',
            'endpoints': {
                'auth': '/api/auth/',
                'departments': '/api/departments/',
                'complaints': '/api/complaints/',
                'track': '/api/complaints/track/',
                'admin': '/admin/',
            }
        })


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Root
    path('api/', api_root, name='api_root'),
    
    # API Endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/departments/', include('departments.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
