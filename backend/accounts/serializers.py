from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User
from departments.models import Department


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for student registration (only students can register)
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.filter(is_active=True))
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'student_id',
            'department', 'date_of_birth', 'address'
        ]
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_student_id(self, value):
        if value and User.objects.filter(student_id=value).exists():
            raise serializers.ValidationError("Student ID already exists")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Force role to Student for registration
        validated_data['role'] = 'Student'
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with additional user info
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom claims
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'department': {
                'id': self.user.department.id,
                'name': self.user.department.name,
                'code': self.user.department.code
            } if self.user.department else None,
            'is_verified': self.user.is_verified,
            'profile_picture': self.user.profile_picture.url if self.user.profile_picture else None,
        }
        
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information
    """
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'department', 'department_name', 'phone_number',
            'student_id', 'employee_id', 'profile_picture', 'date_of_birth',
            'address', 'is_verified', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'role', 'date_joined', 'last_login', 'is_verified']


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users (admin only)
    """
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role',
            'department_name', 'is_active', 'is_verified', 'is_suspended',
            'date_joined', 'last_login'
        ]


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating users (admin only)
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.filter(is_active=True))
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'department', 'phone_number', 'student_id', 'employee_id',
            'date_of_birth', 'address', 'is_active', 'is_verified'
        ]
    
    def validate_student_id(self, value):
        if value and User.objects.filter(student_id=value).exists():
            raise serializers.ValidationError("Student ID already exists")
        return value
    
    def validate_employee_id(self, value):
        if value and User.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Employee ID already exists")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

