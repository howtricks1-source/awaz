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
    Supports login with email or username
    """
    username_field = 'email'  # Allow email as username field
    
    def validate(self, attrs):
        # Get email from attrs and find user by email or username
        email_or_username = attrs.get('email')
        password = attrs.get('password')
        
        if email_or_username and password:
            # Try to find user by email first, then by username
            user = None
            try:
                user = User.objects.get(email=email_or_username)
            except User.DoesNotExist:
                try:
                    user = User.objects.get(username=email_or_username)
                except User.DoesNotExist:
                    pass
            
            if user and user.check_password(password):
                # Set the username for the parent serializer
                attrs['username'] = user.username
                attrs.pop('email', None)  # Remove email from attrs
            else:
                raise serializers.ValidationError('Invalid email/username or password')
        
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
            'department', 'department_name', 'is_active', 
            'is_verified', 'date_joined', 'last_login'
        ]


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value


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
            'is_active', 'is_verified'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user
    
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
