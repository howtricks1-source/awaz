import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Complaint, 
  ComplaintCreate, 
  ComplaintUpdate,
  ComplaintComment,
  ComplaintCommentCreate,
  ComplaintResponse,
  ComplaintResponseCreate,
  ComplaintForward,
  ComplaintForwardCreate,
  ComplaintFeedback,
  ComplaintFeedbackCreate,
  TimelineEvent,
  PaginatedResponse 
} from '@/types';
import { complaintApi } from '@/lib/api';

interface ComplaintState {
  // State
  complaints: Complaint[];
  currentComplaint: Complaint | null;
  comments: ComplaintComment[];
  responses: ComplaintResponse[];
  forwards: ComplaintForward[];
  feedback: ComplaintFeedback[];
  timeline: TimelineEvent[];
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
    priority?: string;
    department?: string;
    assigned_to?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  };
  
  // Actions
  fetchComplaints: (params?: any) => Promise<void>;
  fetchComplaint: (id: number) => Promise<void>;
  createComplaint: (data: ComplaintCreate) => Promise<Complaint>;
  updateComplaint: (id: number, data: ComplaintUpdate) => Promise<Complaint>;
  deleteComplaint: (id: number) => Promise<void>;
  
  // Comments
  fetchComments: (complaintId: number) => Promise<void>;
  addComment: (data: ComplaintCommentCreate) => Promise<ComplaintComment>;
  replyToComment: (commentId: number, reply: string) => Promise<ComplaintComment>;
  
  // Responses
  fetchResponses: (complaintId: number) => Promise<void>;
  addResponse: (data: ComplaintResponseCreate) => Promise<ComplaintResponse>;
  
  // Forwarding
  fetchForwards: (complaintId: number) => Promise<void>;
  forwardComplaint: (data: ComplaintForwardCreate) => Promise<ComplaintForward>;
  
  // Feedback
  fetchFeedback: (complaintId: number) => Promise<void>;
  submitFeedback: (data: ComplaintFeedbackCreate) => Promise<ComplaintFeedback>;
  
  // Timeline
  fetchTimeline: (complaintId: number) => Promise<void>;
  
  // Utility
  setFilters: (filters: any) => void;
  clearError: () => void;
  reset: () => void;
}

export const useComplaintStore = create<ComplaintState>()(
  devtools(
    (set, get) => ({
      // Initial state
      complaints: [],
      currentComplaint: null,
      comments: [],
      responses: [],
      forwards: [],
      feedback: [],
      timeline: [],
      loading: false,
      error: null,
      totalCount: 0,
      currentPage: 1,
      hasNext: false,
      hasPrevious: false,
      filters: {},
      
      // Actions
      fetchComplaints: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await complaintApi.getComplaints({ ...get().filters, ...params });
          const data: PaginatedResponse<Complaint> = response.data;
          
          set({
            complaints: data.results,
            totalCount: data.count,
            hasNext: !!data.next,
            hasPrevious: !!data.previous,
            loading: false,
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch complaints',
            loading: false 
          });
        }
      },
      
      fetchComplaint: async (id: number) => {
        set({ loading: true, error: null });
        try {
          const response = await complaintApi.getComplaint(id);
          set({ 
            currentComplaint: response.data,
            loading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch complaint',
            loading: false 
          });
        }
      },
      
      createComplaint: async (data: ComplaintCreate) => {
        set({ loading: true, error: null });
        try {
          const response = await complaintApi.createComplaint(data);
          const newComplaint = response.data;
          
          set(state => ({
            complaints: [newComplaint, ...state.complaints],
            loading: false
          }));
          
          return newComplaint;
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to create complaint',
            loading: false 
          });
          throw error;
        }
      },
      
      updateComplaint: async (id: number, data: ComplaintUpdate) => {
        set({ loading: true, error: null });
        try {
          const response = await complaintApi.updateComplaint(id, data);
          const updatedComplaint = response.data;
          
          set(state => ({
            complaints: state.complaints.map(c => 
              c.id === id ? updatedComplaint : c
            ),
            currentComplaint: state.currentComplaint?.id === id ? updatedComplaint : state.currentComplaint,
            loading: false
          }));
          
          return updatedComplaint;
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to update complaint',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteComplaint: async (id: number) => {
        set({ loading: true, error: null });
        try {
          await complaintApi.deleteComplaint(id);
          
          set(state => ({
            complaints: state.complaints.filter(c => c.id !== id),
            currentComplaint: state.currentComplaint?.id === id ? null : state.currentComplaint,
            loading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to delete complaint',
            loading: false 
          });
          throw error;
        }
      },
      
      // Comments
      fetchComments: async (complaintId: number) => {
        try {
          const response = await complaintApi.getComments(complaintId);
          set({ comments: response.data });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch comments' });
        }
      },
      
      addComment: async (data: ComplaintCommentCreate) => {
        try {
          const response = await complaintApi.addComment(data);
          const newComment = response.data;
          
          set(state => ({
            comments: [...state.comments, newComment]
          }));
          
          return newComment;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to add comment' });
          throw error;
        }
      },
      
      replyToComment: async (commentId: number, reply: string) => {
        try {
          const response = await complaintApi.replyToComment(commentId, reply);
          const updatedComment = response.data;
          
          set(state => ({
            comments: state.comments.map(c => 
              c.id === commentId ? updatedComment : c
            )
          }));
          
          return updatedComment;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to reply to comment' });
          throw error;
        }
      },
      
      // Responses
      fetchResponses: async (complaintId: number) => {
        try {
          const response = await complaintApi.getResponses(complaintId);
          set({ responses: response.data });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch responses' });
        }
      },
      
      addResponse: async (data: ComplaintResponseCreate) => {
        try {
          const response = await complaintApi.addResponse(data);
          const newResponse = response.data;
          
          set(state => ({
            responses: [...state.responses, newResponse]
          }));
          
          return newResponse;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to add response' });
          throw error;
        }
      },
      
      // Forwarding
      fetchForwards: async (complaintId: number) => {
        try {
          const response = await complaintApi.getForwards(complaintId);
          set({ forwards: response.data });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch forwards' });
        }
      },
      
      forwardComplaint: async (data: ComplaintForwardCreate) => {
        try {
          const response = await complaintApi.forwardComplaint(data);
          const newForward = response.data;
          
          set(state => ({
            forwards: [...state.forwards, newForward]
          }));
          
          return newForward;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to forward complaint' });
          throw error;
        }
      },
      
      // Feedback
      fetchFeedback: async (complaintId: number) => {
        try {
          const response = await complaintApi.getFeedback(complaintId);
          set({ feedback: response.data });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch feedback' });
        }
      },
      
      submitFeedback: async (data: ComplaintFeedbackCreate) => {
        try {
          const response = await complaintApi.submitFeedback(data);
          const newFeedback = response.data;
          
          set(state => ({
            feedback: [...state.feedback, newFeedback]
          }));
          
          return newFeedback;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to submit feedback' });
          throw error;
        }
      },
      
      // Timeline
      fetchTimeline: async (complaintId: number) => {
        try {
          const response = await complaintApi.getTimeline(complaintId);
          set({ timeline: response.data });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch timeline' });
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
          complaints: [],
          currentComplaint: null,
          comments: [],
          responses: [],
          forwards: [],
          feedback: [],
          timeline: [],
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
      name: 'complaint-store',
    }
  )
);
