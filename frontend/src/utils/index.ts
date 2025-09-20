import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { UserRole, ComplaintStatus, ComplaintPriority, CommentType } from '@/types';

// Date formatting utilities
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Status and priority utilities
export const getStatusColor = (status: ComplaintStatus): string => {
  const colors: Record<ComplaintStatus, string> = {
    'Pending': 'warning',
    'In Progress': 'info',
    'Resolved': 'success',
    'Rejected': 'danger',
    'Not Resolved': 'secondary',
    'Closed': 'dark',
  };
  return colors[status] || 'secondary';
};

export const getPriorityColor = (priority: ComplaintPriority): string => {
  const colors: Record<ComplaintPriority, string> = {
    'Low': 'success',
    'Medium': 'warning',
    'High': 'danger',
    'Critical': 'dark',
  };
  return colors[priority] || 'secondary';
};

export const getCommentTypeColor = (type: CommentType): string => {
  const colors: Record<CommentType, string> = {
    'Comment': 'primary',
    'Require Info': 'warning',
    'Ask': 'info',
  };
  return colors[type] || 'secondary';
};

// Role utilities
export const getRoleDisplayName = (role: UserRole): string => {
  const names: Record<UserRole, string> = {
    'Student': 'Student',
    'Staff': 'Staff Member',
    'DepartmentHead': 'Department Head',
    'VC': 'Vice Chancellor',
    'Admin': 'Administrator',
  };
  return names[role] || role;
};

export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    'Student': 'primary',
    'Staff': 'info',
    'DepartmentHead': 'warning',
    'VC': 'danger',
    'Admin': 'dark',
  };
  return colors[role] || 'secondary';
};

// Permission utilities
export const canViewComplaints = (role: UserRole): boolean => {
  return ['Student', 'Staff', 'DepartmentHead', 'VC', 'Admin'].includes(role);
};

export const canCreateComplaints = (role: UserRole): boolean => {
  return role === 'Student';
};

export const canForwardComplaints = (role: UserRole): boolean => {
  return ['Staff', 'DepartmentHead', 'VC', 'Admin'].includes(role);
};

export const canAssignComplaints = (role: UserRole): boolean => {
  return ['DepartmentHead', 'VC', 'Admin'].includes(role);
};

export const canManageUsers = (role: UserRole): boolean => {
  return role === 'Admin';
};

export const canViewAnalytics = (role: UserRole): boolean => {
  return ['DepartmentHead', 'VC', 'Admin'].includes(role);
};

export const canReviewWithdrawals = (role: UserRole): boolean => {
  return ['DepartmentHead', 'VC', 'Admin'].includes(role);
};

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Number utilities
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

export const formatPercentage = (num: number, decimals: number = 1): string => {
  return `${num.toFixed(decimals)}%`;
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Local storage utilities
export const setLocalStorage = (key: string, value: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item);
      } catch {
        return defaultValue;
      }
    }
  }
  return defaultValue;
};

export const removeLocalStorage = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

// Theme utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Error handling utilities
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error.response?.data) {
    // Handle validation errors
    const data = error.response.data;
    if (typeof data === 'object') {
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError)) {
        return firstError[0];
      }
      return String(firstError);
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// URL utilities
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

export const parseQueryString = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

