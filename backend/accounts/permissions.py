from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        return obj == request.user


class IsStudentRole(permissions.BasePermission):
    """
    Permission class to check if user is a Student
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Student'


class IsStaffRole(permissions.BasePermission):
    """
    Permission class to check if user is Staff
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Staff'


class IsDepartmentHeadRole(permissions.BasePermission):
    """
    Permission class to check if user is Department Head
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DepartmentHead'


class IsVCRole(permissions.BasePermission):
    """
    Permission class to check if user is VC
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'VC'


class IsAdminRole(permissions.BasePermission):
    """
    Permission class to check if user is Admin
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Admin'


class CanForwardComplaints(permissions.BasePermission):
    """
    Permission class to check if user can forward complaints
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.can_forward_complaints()
        )


class CanAssignComplaints(permissions.BasePermission):
    """
    Permission class to check if user can assign complaints
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.can_assign_complaints()
        )


class CanManageUsers(permissions.BasePermission):
    """
    Permission class to check if user can manage other users
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.can_manage_users()
        )


class CanViewAnalytics(permissions.BasePermission):
    """
    Permission class to check if user can view analytics
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.can_view_analytics()
        )


class IsStaffOrHigher(permissions.BasePermission):
    """
    Permission class for Staff, Department Head, VC, or Admin roles
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['Staff', 'DepartmentHead', 'VC', 'Admin']
        )


class IsDepartmentHeadOrHigher(permissions.BasePermission):
    """
    Permission class for Department Head, VC, or Admin roles
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['DepartmentHead', 'VC', 'Admin']
        )


class IsVCOrAdmin(permissions.BasePermission):
    """
    Permission class for VC or Admin roles only
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['VC', 'Admin']
        )


class IsComplaintOwnerOrStaff(permissions.BasePermission):
    """
    Permission to check if user is complaint owner or staff member
    """
    def has_object_permission(self, request, view, obj):
        # Allow if user is the complaint creator
        if obj.created_by == request.user:
            return True
        
        # Allow if user is assigned to the complaint
        if obj.assigned_to == request.user:
            return True
        
        # Allow if user is staff or higher
        return request.user.role in ['Staff', 'DepartmentHead', 'VC', 'Admin']


class CanReplyToComment(permissions.BasePermission):
    """
    Permission to check if student can reply to a comment
    """
    def has_object_permission(self, request, view, obj):
        # Only students can reply
        if request.user.role != 'Student':
            return False
        
        # Only complaint owner can reply
        if obj.complaint.created_by != request.user:
            return False
        
        # Only certain comment types allow replies
        return obj.allows_student_reply()


class CanSubmitFeedback(permissions.BasePermission):
    """
    Permission to check if user can submit feedback
    """
    def has_object_permission(self, request, view, obj):
        # Only complaint creator can submit feedback
        if obj.created_by != request.user:
            return False
        
        # Only for closed/resolved complaints
        return obj.can_receive_feedback()

