import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, User, LoginForm, DashboardStats } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dashboardStats: DashboardStats | null;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  fetchDashboardStats: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      dashboardStats: null,

      login: async (credentials: LoginForm) => {
        try {
          set({ isLoading: true });
          const response = await authApi.login(credentials);
          const user = response.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch dashboard stats after login
          get().fetchDashboardStats();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          dashboardStats: null,
        });
        // Clear localStorage
        localStorage.removeItem('auth-storage');
      },

      updateProfile: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...data },
          });
        }
      },

      fetchDashboardStats: async () => {
        try {
          const response = await authApi.getDashboardStats();
          set({ dashboardStats: response.data });
        } catch (error) {
          console.error('Failed to fetch dashboard stats:', error);
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

