from django.db import models

# Analytics models will be primarily handled through views and aggregations
# This file is kept for future analytics-specific models if needed

# For now, analytics will be computed from existing models:
# - Complaint statistics from complaints.Complaint
# - User activity from core.ActivityLog  
# - Department performance from departments.Department
# - Feedback analysis from complaints.ComplaintFeedback
