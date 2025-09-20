from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    StudentRegistrationView, CustomTokenObtainPairView, UserProfileView,
    PasswordChangeView, UserListCreateView, UserDetailView,
    logout_view, user_stats_view
)

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('register/', StudentRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile management
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),
    
    # User management (admin only)
    path('users/', UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('users/stats/', user_stats_view, name='user_stats'),
]

