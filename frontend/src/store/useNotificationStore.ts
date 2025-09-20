import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Notification } from '@/types';
import { notificationApi } from '@/lib/api';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (params?: any) => Promise<void>;
  markAsRead: (notificationIds: number[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  
  // Real-time updates
  addNotification: (notification: Notification) => void;
  updateNotification: (id: number, updates: Partial<Notification>) => void;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      
      // Actions
      fetchNotifications: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await notificationApi.getNotifications(params);
          const notifications = response.data;
          const unreadCount = notifications.filter(n => !n.is_read).length;
          
          set({
            notifications,
            unreadCount,
            loading: false,
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch notifications',
            loading: false 
          });
        }
      },
      
      markAsRead: async (notificationIds: number[]) => {
        try {
          await notificationApi.markAsRead(notificationIds);
          
          set(state => {
            const updatedNotifications = state.notifications.map(n => 
              notificationIds.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            );
            const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
            
            return {
              notifications: updatedNotifications,
              unreadCount,
            };
          });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to mark notifications as read' });
        }
      },
      
      markAllAsRead: async () => {
        try {
          await notificationApi.markAllAsRead();
          
          set(state => ({
            notifications: state.notifications.map(n => ({ 
              ...n, 
              is_read: true, 
              read_at: new Date().toISOString() 
            })),
            unreadCount: 0,
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to mark all notifications as read' });
        }
      },
      
      deleteNotification: async (id: number) => {
        try {
          await notificationApi.deleteNotification(id);
          
          set(state => {
            const updatedNotifications = state.notifications.filter(n => n.id !== id);
            const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
            
            return {
              notifications: updatedNotifications,
              unreadCount,
            };
          });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to delete notification' });
        }
      },
      
      // Real-time updates
      addNotification: (notification: Notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1,
        }));
      },
      
      updateNotification: (id: number, updates: Partial<Notification>) => {
        set(state => {
          const updatedNotifications = state.notifications.map(n => 
            n.id === id ? { ...n, ...updates } : n
          );
          const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },
      
      // Utility
      clearError: () => {
        set({ error: null });
      },
      
      reset: () => {
        set({
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'notification-store',
    }
  )
);
