from rest_framework import serializers
from .models import Department
from accounts.models import User


class DepartmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Department model
    """
    head_name = serializers.CharField(source='head.get_full_name', read_only=True)
    staff_count = serializers.IntegerField(source='get_staff_count', read_only=True)
    student_count = serializers.IntegerField(source='get_student_count', read_only=True)
    active_complaints_count = serializers.IntegerField(source='get_active_complaints_count', read_only=True)
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'description', 'head', 'head_name',
            'email', 'phone', 'location', 'is_active',
            'staff_count', 'student_count', 'active_complaints_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_head(self, value):
        """Validate that head is a Department Head role user"""
        if value and value.role != 'DepartmentHead':
            raise serializers.ValidationError("Head must be a user with DepartmentHead role")
        return value


class DepartmentListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for department listing
    """
    head_name = serializers.CharField(source='head.get_full_name', read_only=True)
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'head_name', 'is_active'
        ]


class DepartmentStatsSerializer(serializers.Serializer):
    """
    Serializer for department statistics
    """
    department_id = serializers.IntegerField()
    department_name = serializers.CharField()
    total_complaints = serializers.IntegerField()
    pending_complaints = serializers.IntegerField()
    resolved_complaints = serializers.IntegerField()
    average_resolution_time = serializers.FloatField()
    staff_count = serializers.IntegerField()
    student_count = serializers.IntegerField()

