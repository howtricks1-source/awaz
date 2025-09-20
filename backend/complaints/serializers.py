from rest_framework import serializers
from django.utils import timezone
from .models import (
    Complaint, ComplaintForward, ComplaintResponse, ComplaintComment,
    ComplaintFeedback, WithdrawalRequest
)
from accounts.models import User
from departments.models import Department


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating complaints
    """
    class Meta:
        model = Complaint
        fields = [
            'title', 'description', 'priority', 'department',
            'attachment', 'is_anonymous', 'is_urgent',
            'expected_resolution_date'
        ]
    
    def validate_department(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Selected department is not active")
        return value
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ComplaintListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing complaints
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    status_color = serializers.CharField(source='get_status_color', read_only=True)
    priority_color = serializers.CharField(source='get_priority_color', read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'title', 'priority', 'status',
            'created_by_name', 'assigned_to_name', 'department_name',
            'status_color', 'priority_color', 'is_urgent', 'created_at'
        ]


class ComplaintDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for complaint with all related data
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    status_color = serializers.CharField(source='get_status_color', read_only=True)
    priority_color = serializers.CharField(source='get_priority_color', read_only=True)
    can_be_forwarded = serializers.BooleanField(source='can_be_forwarded', read_only=True)
    can_receive_feedback = serializers.BooleanField(source='can_receive_feedback', read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'title', 'description', 'priority', 'status',
            'created_by', 'created_by_name', 'assigned_to', 'assigned_to_name',
            'department', 'department_name', 'attachment', 'is_anonymous', 'is_urgent',
            'expected_resolution_date', 'created_at', 'updated_at', 'resolved_at', 'closed_at',
            'status_color', 'priority_color', 'can_be_forwarded', 'can_receive_feedback'
        ]
        read_only_fields = [
            'id', 'complaint_number', 'created_by', 'created_at', 'updated_at'
        ]


class ComplaintUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating complaint status and assignment
    """
    class Meta:
        model = Complaint
        fields = ['status', 'assigned_to', 'priority', 'expected_resolution_date']
    
    def validate_assigned_to(self, value):
        if value and value.role == 'Student':
            raise serializers.ValidationError("Cannot assign complaints to students")
        return value
    
    def update(self, instance, validated_data):
        # Handle status changes with timestamps
        if 'status' in validated_data:
            new_status = validated_data['status']
            if new_status == 'Resolved' and instance.status != 'Resolved':
                instance.resolved_at = timezone.now()
            elif new_status == 'Closed' and instance.status != 'Closed':
                instance.closed_at = timezone.now()
        
        return super().update(instance, validated_data)


class ComplaintForwardSerializer(serializers.ModelSerializer):
    """
    Serializer for forwarding complaints
    """
    from_user_name = serializers.CharField(source='from_user.get_full_name', read_only=True)
    to_user_name = serializers.CharField(source='to_user.get_full_name', read_only=True)
    
    class Meta:
        model = ComplaintForward
        fields = [
            'id', 'complaint', 'from_user', 'from_user_name',
            'to_user', 'to_user_name', 'remarks', 'timestamp'
        ]
        read_only_fields = ['id', 'from_user', 'timestamp']
    
    def validate_to_user(self, value):
        if value.role == 'Student':
            raise serializers.ValidationError("Cannot forward complaints to students")
        return value
    
    def create(self, validated_data):
        validated_data['from_user'] = self.context['request'].user
        return super().create(validated_data)


class ComplaintResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for complaint responses
    """
    added_by_name = serializers.CharField(source='added_by.get_full_name', read_only=True)
    
    class Meta:
        model = ComplaintResponse
        fields = [
            'id', 'complaint', 'message', 'added_by', 'added_by_name',
            'attachment', 'created_at'
        ]
        read_only_fields = ['id', 'added_by', 'created_at']
    
    def create(self, validated_data):
        validated_data['added_by'] = self.context['request'].user
        return super().create(validated_data)


class ComplaintCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for complaint comments
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    type_color = serializers.CharField(source='get_type_color', read_only=True)
    allows_student_reply = serializers.BooleanField(source='allows_student_reply', read_only=True)
    
    class Meta:
        model = ComplaintComment
        fields = [
            'id', 'complaint', 'user', 'user_name', 'user_role',
            'comment_type', 'text', 'reply', 'created_at', 'replied_at',
            'type_color', 'allows_student_reply'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'replied_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ComplaintCommentReplySerializer(serializers.Serializer):
    """
    Serializer for replying to comments
    """
    reply = serializers.CharField(max_length=1000)
    
    def update(self, instance, validated_data):
        instance.reply = validated_data['reply']
        instance.replied_at = timezone.now()
        instance.save()
        return instance


class ComplaintFeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for complaint feedback
    """
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    forwarded_to_name = serializers.CharField(source='forwarded_to.get_full_name', read_only=True)
    rating_stars = serializers.CharField(source='get_rating_stars', read_only=True)
    
    class Meta:
        model = ComplaintFeedback
        fields = [
            'id', 'complaint', 'feedback_text', 'rating', 'submitted_by',
            'submitted_by_name', 'forwarded_to', 'forwarded_to_name',
            'submitted_at', 'rating_stars'
        ]
        read_only_fields = ['id', 'submitted_by', 'submitted_at']
    
    def validate_complaint(self, value):
        if not value.can_receive_feedback():
            raise serializers.ValidationError("Feedback can only be submitted for resolved or closed complaints")
        return value
    
    def validate_forwarded_to(self, value):
        if value and value.role == 'Student':
            raise serializers.ValidationError("Cannot forward feedback to students")
        return value
    
    def create(self, validated_data):
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for withdrawal requests
    """
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    status_color = serializers.CharField(source='get_status_color', read_only=True)
    
    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'request_number', 'type', 'reason', 'status',
            'submitted_by', 'submitted_by_name', 'reviewed_by', 'reviewed_by_name',
            'response', 'effective_date', 'supporting_documents',
            'created_at', 'reviewed_at', 'status_color'
        ]
        read_only_fields = [
            'id', 'request_number', 'submitted_by', 'created_at'
        ]
    
    def create(self, validated_data):
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)


class WithdrawalRequestReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for reviewing withdrawal requests
    """
    class Meta:
        model = WithdrawalRequest
        fields = ['status', 'response', 'effective_date']
    
    def update(self, instance, validated_data):
        validated_data['reviewed_by'] = self.context['request'].user
        validated_data['reviewed_at'] = timezone.now()
        return super().update(instance, validated_data)


class ComplaintTrackSerializer(serializers.Serializer):
    """
    Serializer for tracking complaints by number
    """
    complaint_number = serializers.CharField(max_length=20)
    
    def validate_complaint_number(self, value):
        try:
            complaint = Complaint.objects.get(complaint_number=value)
            return value
        except Complaint.DoesNotExist:
            raise serializers.ValidationError("Complaint not found with this number")


class ComplaintStatsSerializer(serializers.Serializer):
    """
    Serializer for complaint statistics
    """
    total_complaints = serializers.IntegerField()
    pending_complaints = serializers.IntegerField()
    in_progress_complaints = serializers.IntegerField()
    resolved_complaints = serializers.IntegerField()
    rejected_complaints = serializers.IntegerField()
    closed_complaints = serializers.IntegerField()
    average_resolution_time = serializers.FloatField()
    complaints_by_priority = serializers.DictField()
    complaints_by_department = serializers.DictField()
    recent_complaints = serializers.IntegerField()

