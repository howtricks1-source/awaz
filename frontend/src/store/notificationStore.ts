import { create } from 'zustand';
import { Notification } from '@/types';
import { notificationApi } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds: number[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const response = await notificationApi.getNotifications();
      const notifications = response.data;
      const unreadCount = notifications.filter(n => !n.is_read).length;
      
      set({
        notifications,
        unreadCount,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch notifications:', error);
    }
  },

  markAsRead: async (notificationIds: number[]) => {
    try {
      await notificationApi.markAsRead(notificationIds);
      
      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, is_read: true }
          : notification
      );
      
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
      
      set({
        notifications: updatedNotifications,
        unreadCount,
      });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      
      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        is_read: true,
      }));
      
      set({
        notifications: updatedNotifications,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  deleteNotification: async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      
      // Remove from local state
      const { notifications } = get();
      const updatedNotifications = notifications.filter(n => n.id !== id);
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
      
      set({
        notifications: updatedNotifications,
        unreadCount,
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();
    set({
      notifications: [notification, ...notifications],
      unreadCount: notification.is_read ? unreadCount : unreadCount + 1,
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

