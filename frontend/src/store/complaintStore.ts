import { create } from 'zustand';
import { 
  Complaint, 
  ComplaintCreate, 
  ComplaintUpdate,
  ComplaintComment,
  ComplaintResponse,
  ComplaintFeedback,
  TimelineEvent,
  PaginatedResponse 
} from '@/types';
import { complaintApi } from '@/lib/api';

interface ComplaintState {
  complaints: Complaint[];
  currentComplaint: Complaint | null;
  comments: ComplaintComment[];
  responses: ComplaintResponse[];
  timeline: TimelineEvent[];
  isLoading: boolean;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
  filters: {
    status?: string;
    priority?: string;
    department?: string;
    is_urgent?: boolean;
  };

  // Actions
  fetchComplaints: (page?: number) => Promise<void>;
  fetchComplaint: (id: number) => Promise<void>;
  createComplaint: (data: ComplaintCreate) => Promise<Complaint>;
  updateComplaint: (id: number, data: ComplaintUpdate) => Promise<void>;
  forwardComplaint: (complaintId: number, toUserId: number, remarks?: string) => Promise<void>;
  fetchComments: (complaintId: number) => Promise<void>;
  addComment: (complaintId: number, commentType: string, text: string) => Promise<void>;
  replyToComment: (commentId: number, reply: string) => Promise<void>;
  fetchResponses: (complaintId: number) => Promise<void>;
  addResponse: (complaintId: number, message: string, attachment?: File) => Promise<void>;
  submitFeedback: (complaintId: number, rating: number, text: string, forwardedTo?: number) => Promise<void>;
  fetchTimeline: (complaintId: number) => Promise<void>;
  trackComplaint: (complaintNumber: string) => Promise<Complaint>;
  setFilters: (filters: Partial<ComplaintState['filters']>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  clearCurrentComplaint: () => void;
}

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: [],
  currentComplaint: null,
  comments: [],
  responses: [],
  timeline: [],
  isLoading: false,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
  filters: {},

  fetchComplaints: async (page = 1) => {
    try {
      set({ isLoading: true });
      const { filters } = get();
      const response = await complaintApi.getComplaints({ page, ...filters });
      
      set({
        complaints: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchComplaint: async (id: number) => {
    try {
      set({ isLoading: true });
      const response = await complaintApi.getComplaint(id);
      set({
        currentComplaint: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createComplaint: async (data: ComplaintCreate) => {
    try {
      set({ isLoading: true });
      const response = await complaintApi.createComplaint(data);
      
      // Add to complaints list
      const { complaints } = get();
      set({
        complaints: [response.data, ...complaints],
        isLoading: false,
      });
      
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateComplaint: async (id: number, data: ComplaintUpdate) => {
    try {
      set({ isLoading: true });
      const response = await complaintApi.updateComplaint(id, data);
      
      // Update in complaints list
      const { complaints, currentComplaint } = get();
      const updatedComplaints = complaints.map(complaint =>
        complaint.id === id ? response.data : complaint
      );
      
      set({
        complaints: updatedComplaints,
        currentComplaint: currentComplaint?.id === id ? response.data : currentComplaint,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  forwardComplaint: async (complaintId: number, toUserId: number, remarks?: string) => {
    try {
      set({ isLoading: true });
      await complaintApi.forwardComplaint({
        complaint: complaintId,
        to_user: toUserId,
        remarks,
      });
      
      // Refresh complaint data
      await get().fetchComplaint(complaintId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchComments: async (complaintId: number) => {
    try {
      const response = await complaintApi.getComments(complaintId);
      set({ comments: response.data });
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  },

  addComment: async (complaintId: number, commentType: string, text: string) => {
    try {
      const response = await complaintApi.addComment({
        complaint: complaintId,
        comment_type: commentType as any,
        text,
      });
      
      // Add to comments list
      const { comments } = get();
      set({ comments: [response.data, ...comments] });
    } catch (error) {
      throw error;
    }
  },

  replyToComment: async (commentId: number, reply: string) => {
    try {
      const response = await complaintApi.replyToComment(commentId, { reply });
      
      // Update comment in list
      const { comments } = get();
      const updatedComments = comments.map(comment =>
        comment.id === commentId ? response.data : comment
      );
      set({ comments: updatedComments });
    } catch (error) {
      throw error;
    }
  },

  fetchResponses: async (complaintId: number) => {
    try {
      const response = await complaintApi.getResponses(complaintId);
      set({ responses: response.data });
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    }
  },

  addResponse: async (complaintId: number, message: string, attachment?: File) => {
    try {
      const response = await complaintApi.addResponse({
        complaint: complaintId,
        message,
        attachment,
      });
      
      // Add to responses list
      const { responses } = get();
      set({ responses: [response.data, ...responses] });
    } catch (error) {
      throw error;
    }
  },

  submitFeedback: async (complaintId: number, rating: number, text: string, forwardedTo?: number) => {
    try {
      await complaintApi.submitFeedback({
        complaint: complaintId,
        rating,
        feedback_text: text,
        forwarded_to: forwardedTo,
      });
    } catch (error) {
      throw error;
    }
  },

  fetchTimeline: async (complaintId: number) => {
    try {
      const response = await complaintApi.getTimeline(complaintId);
      set({ timeline: response.data });
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  },

  trackComplaint: async (complaintNumber: string) => {
    try {
      set({ isLoading: true });
      const response = await complaintApi.trackComplaint(complaintNumber);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setFilters: (filters: Partial<ComplaintState['filters']>) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  clearCurrentComplaint: () => {
    set({
      currentComplaint: null,
      comments: [],
      responses: [],
      timeline: [],
    });
  },
}));

