from django.urls import path
from .views import (
    DepartmentListView, DepartmentDetailView, DepartmentManageView,
    DepartmentManageDetailView, department_stats_view
)

app_name = 'departments'

urlpatterns = [
    # Public department endpoints
    path('', DepartmentListView.as_view(), name='department_list'),
    path('<int:pk>/', DepartmentDetailView.as_view(), name='department_detail'),
    
    # Department management (admin only)
    path('manage/', DepartmentManageView.as_view(), name='department_manage'),
    path('manage/<int:pk>/', DepartmentManageDetailView.as_view(), name='department_manage_detail'),
    
    # Department statistics
    path('stats/', department_stats_view, name='department_stats'),
]

