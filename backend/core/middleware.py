"""
Middleware for automatic activity logging and request tracking
"""
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve
from .logging import ActivityLogger, get_client_ip
import time
import json


class ActivityLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log user activities
    """
    
    # Actions that should be logged automatically
    LOG_ACTIONS = {
        'GET': 'view',
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete',
    }
    
    # URLs that should not be logged (to avoid spam)
    EXCLUDE_URLS = [
        '/api/auth/refresh/',
        '/api/notifications/',
        '/admin/jsi18n/',
        '/static/',
        '/media/',
        '/favicon.ico',
    ]
    
    def process_request(self, request):
        """
        Process incoming request
        """
        request.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """
        Process response and log activity if needed
        """
        # Skip logging for excluded URLs
        if any(request.path.startswith(url) for url in self.EXCLUDE_URLS):
            return response
        
        # Skip logging for unauthenticated users (except login/register)
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            if not any(path in request.path for path in ['/auth/login/', '/auth/register/']):
                return response
        
        # Skip logging for OPTIONS requests
        if request.method == 'OPTIONS':
            return response
        
        try:
            self._log_request_activity(request, response)
        except Exception as e:
            # Don't break the response if logging fails
            print(f"Activity logging middleware error: {e}")
        
        return response
    
    def _log_request_activity(self, request, response):
        """
        Log the request activity
        """
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return
        
        # Get basic request info
        method = request.method
        path = request.path
        status_code = response.status_code
        
        # Skip successful GET requests to avoid spam (unless it's a specific resource)
        if method == 'GET' and status_code == 200:
            if not self._should_log_get_request(path):
                return
        
        # Get action type
        action = self.LOG_ACTIONS.get(method, 'unknown')
        
        # Create description
        description = self._create_description(request, response, action)
        
        # Get additional context
        additional_data = {
            'method': method,
            'path': path,
            'status_code': status_code,
            'response_time': getattr(request, 'start_time', None) and time.time() - request.start_time,
        }
        
        # Try to get related objects from URL
        complaint = self._get_complaint_from_url(path)
        withdrawal = self._get_withdrawal_from_url(path)
        
        # Log the activity
        ActivityLogger.log_activity(
            user=request.user,
            action=action,
            description=description,
            complaint=complaint,
            withdrawal=withdrawal,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            additional_data=additional_data
        )
    
    def _should_log_get_request(self, path):
        """
        Determine if GET request should be logged
        """
        # Log specific resource views
        log_patterns = [
            '/api/complaints/',
            '/api/withdrawals/',
            '/api/reports/',
            '/api/analytics/',
            '/dashboard/',
        ]
        
        return any(pattern in path for pattern in log_patterns)
    
    def _create_description(self, request, response, action):
        """
        Create human-readable description of the activity
        """
        path = request.path
        method = request.method
        status_code = response.status_code
        
        # Handle different endpoints
        if '/api/complaints/' in path:
            if method == 'GET':
                if path.endswith('/'):
                    return "Viewed complaints list"
                else:
                    return f"Viewed complaint details"
            elif method == 'POST':
                return "Created new complaint"
            elif method in ['PUT', 'PATCH']:
                return "Updated complaint"
            elif method == 'DELETE':
                return "Deleted complaint"
        
        elif '/api/withdrawals/' in path:
            if method == 'GET':
                return "Viewed withdrawal requests"
            elif method == 'POST':
                return "Submitted withdrawal request"
            elif method in ['PUT', 'PATCH']:
                return "Updated withdrawal request"
        
        elif '/api/auth/' in path:
            if 'login' in path:
                return "User login attempt"
            elif 'logout' in path:
                return "User logout"
            elif 'register' in path:
                return "User registration attempt"
        
        elif '/dashboard/' in path:
            return f"Accessed {action} dashboard"
        
        # Generic description
        return f"Performed {action} on {path}"
    
    def _get_complaint_from_url(self, path):
        """
        Extract complaint object from URL if present
        """
        try:
            if '/api/complaints/' in path:
                # Extract complaint ID from URL
                parts = path.split('/')
                if 'complaints' in parts:
                    idx = parts.index('complaints')
                    if idx + 1 < len(parts) and parts[idx + 1].isdigit():
                        from complaints.models import Complaint
                        return Complaint.objects.get(id=int(parts[idx + 1]))
        except:
            pass
        return None
    
    def _get_withdrawal_from_url(self, path):
        """
        Extract withdrawal object from URL if present
        """
        try:
            if '/api/withdrawals/' in path:
                # Extract withdrawal ID from URL
                parts = path.split('/')
                if 'withdrawals' in parts:
                    idx = parts.index('withdrawals')
                    if idx + 1 < len(parts) and parts[idx + 1].isdigit():
                        from complaints.models import WithdrawalRequest
                        return WithdrawalRequest.objects.get(id=int(parts[idx + 1]))
        except:
            pass
        return None


class RequestTrackingMiddleware(MiddlewareMixin):
    """
    Middleware to track request performance and errors
    """
    
    def process_request(self, request):
        """
        Start tracking request
        """
        request.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """
        Track response time and log slow requests
        """
        if hasattr(request, 'start_time'):
            response_time = time.time() - request.start_time
            
            # Log slow requests (> 2 seconds)
            if response_time > 2.0:
                print(f"Slow request: {request.method} {request.path} - {response_time:.2f}s")
            
            # Add response time header for debugging
            response['X-Response-Time'] = f"{response_time:.3f}s"
        
        return response
    
    def process_exception(self, request, exception):
        """
        Log exceptions
        """
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                ActivityLogger.log_activity(
                    user=request.user,
                    action='error',
                    description=f"Error occurred: {str(exception)}",
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    additional_data={
                        'exception_type': type(exception).__name__,
                        'exception_message': str(exception),
                        'path': request.path,
                        'method': request.method,
                    }
                )
            except:
                pass  # Don't break error handling if logging fails
        
        return None  # Let Django handle the exception normally


class SecurityMiddleware(MiddlewareMixin):
    """
    Additional security middleware for the complaint system
    """
    
    def process_request(self, request):
        """
        Add security headers and checks
        """
        # Log suspicious activities
        if self._is_suspicious_request(request):
            if hasattr(request, 'user') and request.user.is_authenticated:
                ActivityLogger.log_activity(
                    user=request.user,
                    action='security',
                    description=f"Suspicious activity detected: {request.path}",
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    additional_data={
                        'suspicious_reason': 'Unusual request pattern',
                        'path': request.path,
                        'method': request.method,
                    }
                )
        
        return None
    
    def process_response(self, request, response):
        """
        Add security headers to response
        """
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
    
    def _is_suspicious_request(self, request):
        """
        Detect potentially suspicious requests
        """
        suspicious_patterns = [
            'script',
            'javascript:',
            '<script',
            'eval(',
            'union select',
            'drop table',
            '../../../',
        ]
        
        # Check URL and parameters
        full_path = request.get_full_path().lower()
        return any(pattern in full_path for pattern in suspicious_patterns)
