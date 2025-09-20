import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, User, LoginForm, RegisterForm } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authApi.login({ email, password });
          const user = response.data;
          
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 
                              error.response?.data?.detail || 
                              error.message || 
                              'Login failed. Please try again.';
          
          set({
            loading: false,
            error: errorMessage,
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (userData: RegisterForm) => {
        try {
          set({ loading: true, error: null });
          
          await authApi.register(userData);
          
          set({
            loading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 
                              error.response?.data?.detail || 
                              error.response?.data?.email?.[0] ||
                              error.response?.data?.username?.[0] ||
                              error.message || 
                              'Registration failed. Please try again.';
          
          set({
            loading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout API to invalidate token on server
          await authApi.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error);
        } finally {
          // Clear local state regardless of API call result
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
          
          // Clear localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
          }
        }
      },

      checkAuth: async () => {
        try {
          set({ loading: true });
          
          // Check if we have a stored user
          const { user } = get();
          if (!user?.access_token) {
            set({ loading: false, isAuthenticated: false });
            return;
          }

          // Verify token is still valid by fetching profile
          const response = await authApi.getProfile();
          const updatedUser = { ...user, ...response.data };
          
          set({
            user: updatedUser,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          // Token is invalid, clear auth state
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
          }
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authApi.updateProfile(data);
          const { user } = get();
          
          if (user) {
            const updatedUser = { ...user, ...response.data };
            set({
              user: updatedUser,
              loading: false,
            });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 
                              error.response?.data?.detail || 
                              error.message || 
                              'Profile update failed.';
          
          set({
            loading: false,
            error: errorMessage,
          });
          throw error;
        }
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
