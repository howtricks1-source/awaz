import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthUser, 
  LoginForm, 
  RegisterForm, 
  User,
  Complaint,
  ComplaintCreate,
  ComplaintUpdate,
  ComplaintForwardCreate,
  ComplaintComment,
  ComplaintCommentCreate,
  ComplaintResponse,
  ComplaintResponseCreate,
  ComplaintFeedback,
  ComplaintFeedbackCreate,
  WithdrawalRequest,
  WithdrawalRequestCreate,
  WithdrawalRequestReview,
  Notification,
  Department,
  DashboardStats,
  ComplaintStats,
  DepartmentStats,
  TimelineEvent,
  PaginatedResponse,
  ApiResponse
} from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.user?.access_token) {
          config.headers.Authorization = `Bearer ${state.user.access_token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export the api instance for direct use
export { api };

// Helper function to handle file uploads
const createFormData = (data: any): FormData => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value instanceof File) {
      formData.append(key, value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });
  
  return formData;
};

// Authentication API
export const authApi = {
  login: (credentials: LoginForm): Promise<AxiosResponse<AuthUser>> =>
    api.post('/auth/login/', credentials),

  register: (data: RegisterForm): Promise<AxiosResponse<User>> =>
    api.post('/auth/register/', data),

  logout: (): Promise<AxiosResponse<void>> =>
    api.post('/auth/logout/'),

  getProfile: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/profile/'),

  updateProfile: (data: Partial<User>): Promise<AxiosResponse<User>> =>
    api.patch('/auth/profile/', data),

  changePassword: (data: { current_password: string; new_password: string }): Promise<AxiosResponse<void>> =>
    api.post('/auth/change-password/', data),

  getUsers: (params?: any): Promise<AxiosResponse<PaginatedResponse<User>>> =>
    api.get('/auth/users/', { params }),

  getUserStats: (): Promise<AxiosResponse<any>> =>
    api.get('/auth/users/stats/'),

  getDashboardStats: (): Promise<AxiosResponse<DashboardStats>> =>
    api.get('/analytics/dashboard/'),
};

// Department API
export const departmentApi = {
  getDepartments: (): Promise<AxiosResponse<Department[]>> =>
    api.get('/departments/'),

  getDepartment: (id: number): Promise<AxiosResponse<Department>> =>
    api.get(`/departments/${id}/`),

  getDepartmentStats: (): Promise<AxiosResponse<DepartmentStats[]>> =>
    api.get('/departments/stats/'),

  createDepartment: (data: Partial<Department>): Promise<AxiosResponse<Department>> =>
    api.post('/departments/manage/', data),

  updateDepartment: (id: number, data: Partial<Department>): Promise<AxiosResponse<Department>> =>
    api.patch(`/departments/manage/${id}/`, data),

  deleteDepartment: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/departments/manage/${id}/`),
};

// Complaint API
export const complaintApi = {
  getComplaints: (params?: any): Promise<AxiosResponse<PaginatedResponse<Complaint>>> =>
    api.get('/complaints/', { params }),

  getComplaint: (id: number): Promise<AxiosResponse<Complaint>> =>
    api.get(`/complaints/${id}/`),

  createComplaint: (data: ComplaintCreate): Promise<AxiosResponse<Complaint>> => {
    const hasFile = data.attachment instanceof File;
    return api.post('/complaints/create/', hasFile ? createFormData(data) : data, {
      headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  updateComplaint: (id: number, data: ComplaintUpdate): Promise<AxiosResponse<Complaint>> =>
    api.patch(`/complaints/${id}/`, data),

  forwardComplaint: (data: ComplaintForwardCreate): Promise<AxiosResponse<void>> =>
    api.post('/complaints/forward/', data),

  getComments: (complaintId: number): Promise<AxiosResponse<ComplaintComment[]>> =>
    api.get(`/complaints/${complaintId}/comments/`),

  addComment: (data: ComplaintCommentCreate): Promise<AxiosResponse<ComplaintComment>> =>
    api.post(`/complaints/${data.complaint}/comments/`, data),

  replyToComment: (commentId: number, data: { reply: string }): Promise<AxiosResponse<ComplaintComment>> =>
    api.patch(`/complaints/comments/${commentId}/reply/`, data),

  getResponses: (complaintId: number): Promise<AxiosResponse<ComplaintResponse[]>> =>
    api.get(`/complaints/${complaintId}/responses/`),

  addResponse: (data: ComplaintResponseCreate): Promise<AxiosResponse<ComplaintResponse>> => {
    const hasFile = data.attachment instanceof File;
    return api.post(`/complaints/${data.complaint}/responses/`, hasFile ? createFormData(data) : data, {
      headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  submitFeedback: (data: ComplaintFeedbackCreate): Promise<AxiosResponse<ComplaintFeedback>> =>
    api.post('/complaints/feedback/', data),

  getFeedback: (): Promise<AxiosResponse<ComplaintFeedback[]>> =>
    api.get('/complaints/feedback/list/'),

  trackComplaint: (complaintNumber: string): Promise<AxiosResponse<Complaint>> =>
    api.get('/complaints/track/', { params: { complaint_number: complaintNumber } }),

  getTimeline: (complaintId: number): Promise<AxiosResponse<TimelineEvent[]>> =>
    api.get(`/complaints/${complaintId}/timeline/`),

  getStats: (): Promise<AxiosResponse<ComplaintStats>> =>
    api.get('/complaints/stats/'),
};

// Withdrawal Request API
export const withdrawalApi = {
  getWithdrawals: (params?: any): Promise<AxiosResponse<PaginatedResponse<WithdrawalRequest>>> =>
    api.get('/complaints/withdrawals/', { params }),

  getWithdrawal: (id: number): Promise<AxiosResponse<WithdrawalRequest>> =>
    api.get(`/complaints/withdrawals/${id}/`),

  createWithdrawal: (data: WithdrawalRequestCreate): Promise<AxiosResponse<WithdrawalRequest>> => {
    const hasFile = data.supporting_documents instanceof File;
    return api.post('/complaints/withdrawals/create/', hasFile ? createFormData(data) : data, {
      headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  reviewWithdrawal: (id: number, data: WithdrawalRequestReview): Promise<AxiosResponse<WithdrawalRequest>> =>
    api.patch(`/complaints/withdrawals/${id}/`, data),
};

// Notification API
export const notificationApi = {
  getNotifications: (params?: any): Promise<AxiosResponse<Notification[]>> =>
    api.get('/notifications/', { params }),

  getNotification: (id: number): Promise<AxiosResponse<Notification>> =>
    api.get(`/notifications/${id}/`),

  markAsRead: (notificationIds: number[]): Promise<AxiosResponse<void>> =>
    api.post('/notifications/mark-read/', { notification_ids: notificationIds }),

  markAllAsRead: (): Promise<AxiosResponse<void>> =>
    api.post('/notifications/mark-all-read/'),

  deleteNotification: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/notifications/${id}/delete/`),

  getStats: (): Promise<AxiosResponse<any>> =>
    api.get('/notifications/stats/'),
};

// Analytics API
export const analyticsApi = {
  getDashboardStats: (): Promise<AxiosResponse<DashboardStats>> =>
    api.get('/analytics/dashboard/'),

  getComplaintAnalytics: (): Promise<AxiosResponse<any>> =>
    api.get('/analytics/complaints/'),

  getDepartmentAnalytics: (): Promise<AxiosResponse<any[]>> =>
    api.get('/analytics/departments/'),

  getFeedbackAnalytics: (): Promise<AxiosResponse<any>> =>
    api.get('/analytics/feedback/'),

  getWithdrawalAnalytics: (): Promise<AxiosResponse<any>> =>
    api.get('/analytics/withdrawals/'),

  getMonthlyTrends: (): Promise<AxiosResponse<any[]>> =>
    api.get('/analytics/trends/'),

  getSystemOverview: (): Promise<AxiosResponse<any>> =>
    api.get('/analytics/system/'),

  getUserActivity: (): Promise<AxiosResponse<any[]>> =>
    api.get('/analytics/users/'),
};

export default api;
