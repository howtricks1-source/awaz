import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  WithdrawalRequest, 
  WithdrawalRequestCreate, 
  WithdrawalRequestReview,
  PaginatedResponse 
} from '@/types';
import { withdrawalApi } from '@/lib/api';

interface WithdrawalState {
  // State
  withdrawals: WithdrawalRequest[];
  currentWithdrawal: WithdrawalRequest | null;
  loading: boolean;
  error: string | null;
  
  // Pagination
  totalCount: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  
  // Filters
  filters: {
    status?: string;
    type?: string;
    submitted_by?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  };
  
  // Actions
  fetchWithdrawals: (params?: any) => Promise<void>;
  fetchWithdrawal: (id: number) => Promise<void>;
  createWithdrawal: (data: WithdrawalRequestCreate) => Promise<WithdrawalRequest>;
  reviewWithdrawal: (id: number, data: WithdrawalRequestReview) => Promise<WithdrawalRequest>;
  
  // Utility
  setFilters: (filters: any) => void;
  clearError: () => void;
  reset: () => void;
}

export const useWithdrawalStore = create<WithdrawalState>()(
  devtools(
    (set, get) => ({
      // Initial state
      withdrawals: [],
      currentWithdrawal: null,
      loading: false,
      error: null,
      totalCount: 0,
      currentPage: 1,
      hasNext: false,
      hasPrevious: false,
      filters: {},
      
      // Actions
      fetchWithdrawals: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await withdrawalApi.getWithdrawals({ ...get().filters, ...params });
          const data: PaginatedResponse<WithdrawalRequest> = response.data;
          
          set({
            withdrawals: data.results,
            totalCount: data.count,
            hasNext: !!data.next,
            hasPrevious: !!data.previous,
            loading: false,
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch withdrawal requests',
            loading: false 
          });
        }
      },
      
      fetchWithdrawal: async (id: number) => {
        set({ loading: true, error: null });
        try {
          const response = await withdrawalApi.getWithdrawal(id);
          set({ 
            currentWithdrawal: response.data,
            loading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch withdrawal request',
            loading: false 
          });
        }
      },
      
      createWithdrawal: async (data: WithdrawalRequestCreate) => {
        set({ loading: true, error: null });
        try {
          const response = await withdrawalApi.createWithdrawal(data);
          const newWithdrawal = response.data;
          
          set(state => ({
            withdrawals: [newWithdrawal, ...state.withdrawals],
            loading: false
          }));
          
          return newWithdrawal;
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to create withdrawal request',
            loading: false 
          });
          throw error;
        }
      },
      
      reviewWithdrawal: async (id: number, data: WithdrawalRequestReview) => {
        set({ loading: true, error: null });
        try {
          const response = await withdrawalApi.reviewWithdrawal(id, data);
          const updatedWithdrawal = response.data;
          
          set(state => ({
            withdrawals: state.withdrawals.map(w => 
              w.id === id ? updatedWithdrawal : w
            ),
            currentWithdrawal: state.currentWithdrawal?.id === id ? updatedWithdrawal : state.currentWithdrawal,
            loading: false
          }));
          
          return updatedWithdrawal;
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to review withdrawal request',
            loading: false 
          });
          throw error;
        }
      },
      
      // Utility
      setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      reset: () => {
        set({
          withdrawals: [],
          currentWithdrawal: null,
          loading: false,
          error: null,
          totalCount: 0,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
          filters: {},
        });
      },
    }),
    {
      name: 'withdrawal-store',
    }
  )
);
