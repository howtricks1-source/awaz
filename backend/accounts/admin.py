from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'department', 'is_active', 'date_joined')
    list_filter = ('role', 'department', 'is_active', 'is_verified', 'is_suspended', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'student_id', 'employee_id')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Department', {
            'fields': ('role', 'department')
        }),
        ('Profile Information', {
            'fields': ('phone_number', 'student_id', 'employee_id', 'profile_picture', 'date_of_birth', 'address')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_suspended', 'last_login_ip')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role & Department', {
            'fields': ('role', 'department')
        }),
        ('Profile Information', {
            'fields': ('phone_number', 'student_id', 'employee_id', 'profile_picture', 'date_of_birth', 'address')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('department')
