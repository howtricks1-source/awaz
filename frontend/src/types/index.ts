// User Types
export type UserRole = 'Student' | 'Staff' | 'DepartmentHead' | 'VC' | 'Admin';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: Department;
  phone?: string;
  student_id?: string;
  employee_id?: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

export interface AuthUser extends User {
  access_token: string;
  refresh_token: string;
}

// Department Types
export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  head?: User;
  head_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  is_active: boolean;
  staff_count: number;
  student_count: number;
  active_complaints_count: number;
  created_at: string;
  updated_at: string;
}

// Complaint Types
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected' | 'Not Resolved' | 'Closed';
export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Complaint {
  id: number;
  complaint_number: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  created_by: User;
  created_by_name: string;
  assigned_to?: User;
  assigned_to_name?: string;
  department: Department;
  department_name: string;
  attachment?: string;
  is_anonymous: boolean;
  is_urgent: boolean;
  expected_resolution_date?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  status_color: string;
  priority_color: string;
  can_be_forwarded: boolean;
  can_receive_feedback: boolean;
}

export interface ComplaintCreate {
  title: string;
  description: string;
  priority: ComplaintPriority;
  department: number;
  attachment?: File;
  is_anonymous?: boolean;
  is_urgent?: boolean;
  expected_resolution_date?: string;
}

export interface ComplaintUpdate {
  status?: ComplaintStatus;
  assigned_to?: number;
  priority?: ComplaintPriority;
  expected_resolution_date?: string;
}

// Comment Types
export type CommentType = 'Comment' | 'Require Info' | 'Ask';

export interface ComplaintComment {
  id: number;
  complaint: number;
  user: User;
  user_name: string;
  user_role: UserRole;
  comment_type: CommentType;
  text: string;
  reply?: string;
  created_at: string;
  replied_at?: string;
  type_color: string;
  allows_student_reply: boolean;
}

export interface ComplaintCommentCreate {
  complaint: number;
  comment_type: CommentType;
  text: string;
}

// Forward Types
export interface ComplaintForward {
  id: number;
  complaint: number;
  from_user: User;
  from_user_name: string;
  to_user: User;
  to_user_name: string;
  remarks?: string;
  timestamp: string;
}

export interface ComplaintForwardCreate {
  complaint: number;
  to_user: number;
  remarks?: string;
}

// Response Types
export interface ComplaintResponse {
  id: number;
  complaint: number;
  message: string;
  added_by: User;
  added_by_name: string;
  attachment?: string;
  created_at: string;
}

export interface ComplaintResponseCreate {
  complaint: number;
  message: string;
  attachment?: File;
}

// Feedback Types
export interface ComplaintFeedback {
  id: number;
  complaint: Complaint;
  feedback_text: string;
  rating: number;
  submitted_by: User;
  submitted_by_name: string;
  forwarded_to?: User;
  forwarded_to_name?: string;
  submitted_at: string;
  rating_stars: string;
}

export interface ComplaintFeedbackCreate {
  complaint: number;
  feedback_text: string;
  rating: number;
  forwarded_to?: number;
}

// Withdrawal Request Types
export type WithdrawalType = 'Course' | 'Semester' | 'Program' | 'University';
export type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface WithdrawalRequest {
  id: number;
  request_number: string;
  type: WithdrawalType;
  reason: string;
  status: WithdrawalStatus;
  submitted_by: User;
  submitted_by_name: string;
  reviewed_by?: User;
  reviewed_by_name?: string;
  response?: string;
  effective_date?: string;
  supporting_documents?: string;
  created_at: string;
  reviewed_at?: string;
  status_color: string;
}

export interface WithdrawalRequestCreate {
  type: WithdrawalType;
  reason: string;
  effective_date?: string;
  supporting_documents?: File;
}

export interface WithdrawalRequestReview {
  status: WithdrawalStatus;
  response: string;
  effective_date?: string;
}

// Notification Types
export type NotificationType = 
  | 'complaint_created'
  | 'complaint_assigned'
  | 'complaint_forwarded'
  | 'complaint_commented'
  | 'complaint_replied'
  | 'complaint_status_changed'
  | 'withdrawal_submitted'
  | 'withdrawal_reviewed'
  | 'feedback_submitted'
  | 'system_announcement';

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  link?: string;
  is_read: boolean;
  is_important: boolean;
  created_at: string;
  read_at?: string;
  type_icon: string;
  type_color: string;
  time_since: string;
}

// Timeline Types
export interface TimelineEvent {
  type: string;
  timestamp: string;
  user?: User;
  description: string;
  message?: string;
  remarks?: string;
  attachment?: string;
  reply?: string;
  replied_at?: string;
  icon: string;
  color: string;
}

// Statistics Types
export interface DashboardStats {
  my_complaints?: number;
  pending_complaints?: number;
  resolved_complaints?: number;
  in_progress_complaints?: number;
  assigned_complaints?: number;
  pending_assigned?: number;
  in_progress_assigned?: number;
  department_complaints?: number;
  unresolved_complaints?: number;
  total_complaints?: number;
  my_withdrawals?: number;
  department_withdrawals?: number;
  total_withdrawals?: number;
  pending_withdrawals?: number;
  unread_notifications?: number;
}

export interface ComplaintStats {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  rejected_complaints: number;
  closed_complaints: number;
  average_resolution_time: number;
  complaints_by_priority: Record<string, number>;
  complaints_by_department: Record<string, number>;
  recent_complaints: number;
}

export interface DepartmentStats {
  department_id: number;
  department_name: string;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  average_resolution_time: number;
  staff_count: number;
  student_count: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Form Types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  studentId: string;
  phone?: string;
}



export interface ProfileUpdateForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface ChangePasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// UI Types
export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  badge?: number;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

// Theme Types
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
