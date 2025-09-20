'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from 'react-bootstrap';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import Navbar from './Navbar';
import { useTheme } from '@/components/providers/AppProviders';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, user, fetchDashboardStats } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Fetch initial data
    fetchDashboardStats();
    fetchNotifications();

    // Set up periodic refresh for notifications
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(notificationInterval);
    };
  }, [isAuthenticated, router, fetchDashboardStats, fetchNotifications]);

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-vh-100">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Container fluid className="px-4">
          {children}
        </Container>
      </main>
    </div>
  );
};

export default DashboardLayout;

