// frontend/store/useStore.ts
import { create } from 'zustand';
import { WorkRequest, User, Role, CommentType } from '../types';
import { CACHE_TIME } from '../constants';
import { apiService } from '../services/api';

export type AppView = 'dashboard' | 'work-queue' | 'analytics';

interface AppState {
  requests: WorkRequest[];
  currentUser: User | null;
  isAuthenticated: boolean;
  lastFetched: number | null;
  isLoading: boolean;
  error: string | null;
  currentView: AppView;
  authorizedAgents: string[];

  // Actions
  fetchRequests: (force?: boolean) => Promise<void>;
  createRequest: (data: Partial<WorkRequest>) => Promise<void>;
  updateRequest: (id: string, updates: Partial<WorkRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  addComment: (requestId: string, content: string, type: CommentType) => Promise<void>;
  login: (role: Role, agentName?: string) => void;
  logout: () => void;
  setView: (view: AppView) => void;
  clearError: () => void;
  // If you still need these (optional)
  addNewAgent: (agentId: string) => void;
  getAuthorizedAgents: () => string[];
}

export const useStore = create<AppState>((set, get) => ({
  requests: [],
  currentUser: null,
  isAuthenticated: false,
  lastFetched: null,
  isLoading: false,
  error: null,
  currentView: 'dashboard',
  authorizedAgents: [
    'AGT-101', 'AGT-102', 'AGT-103', 'AGT-104', 'AGT-105',
    'AGT-106', 'AGT-107', 'AGT-108', 'AGT-109', 'AGT-110'
  ],

  clearError: () => set({ error: null }),

  getAuthorizedAgents: () => {
    return get().authorizedAgents;
  },

  addNewAgent: (agentId: string) => {
    const current = get().authorizedAgents;
    if (!current.includes(agentId)) {
      set({ authorizedAgents: [...current, agentId] });
    }
  },

  fetchRequests: async (force = false) => {
    const { lastFetched } = get();
    const now = Date.now();

    if (!force && lastFetched && now - lastFetched < CACHE_TIME) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await apiService.getWorkRequests();
      set({ requests: data, lastFetched: now, isLoading: false, error: null });
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
      set({ 
        error: err.message || 'Failed to load operational data.', 
        isLoading: false 
      });
    }
  },

  createRequest: async (data) => {
    const { currentUser } = get();
    if (!currentUser) {
      set({ error: 'Authentication required.' });
      throw new Error('Authentication required');
    }

    set({ isLoading: true, error: null });

    try {
      const newRequest = await apiService.createWorkRequest(data, currentUser);
      set((state) => ({
        requests: [...state.requests, newRequest],
        lastFetched: null,
        isLoading: false,
        error: null
      }));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create request.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  updateRequest: async (id, updates) => {
    const { currentUser } = get();
    if (!currentUser) {
      set({ error: 'Authentication required.' });
      throw new Error('Authentication required');
    }

    set({ isLoading: true, error: null });

    try {
      const updated = await apiService.updateWorkRequest(id, updates, currentUser);
      set((state) => ({
        requests: state.requests.map((r) => (r.id === id ? updated : r)),
        lastFetched: null,
        isLoading: false,
        error: null
      }));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update request.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  deleteRequest: async (id) => {
    const { currentUser } = get();
    
    if (!currentUser) {
      const error = 'Authentication required.';
      set({ error });
      throw new Error(error);
    }
    
    if (currentUser.role !== Role.ADMIN) {
      const error = 'Access Denied: Administrative privileges required.';
      set({ error });
      throw new Error(error);
    }

    set({ isLoading: true, error: null });

    try {
      await apiService.deleteWorkRequest(id, currentUser);
      set((state) => ({
        requests: state.requests.filter((r) => r.id !== id),
        lastFetched: null,
        isLoading: false,
        error: null
      }));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete request.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  addComment: async (requestId: string, content: string, type: CommentType) => {
    const { currentUser } = get();
    if (!currentUser) {
      set({ error: 'Authentication required.' });
      throw new Error('Authentication required');
    }

    set({ error: null });

    try {
      const updated = await apiService.addComment(requestId, content, type, currentUser);
      set((state) => ({
        requests: state.requests.map((r) => (r.id === requestId ? updated : r)),
        error: null
      }));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to add comment.';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  // FIXED LOGIN ACTION - now properly sets the agent name
  login: (role: Role, agentName?: string) => {
    console.log('LOGIN ACTION CALLED - Role:', role, 'Agent:', agentName);

    const id = Date.now().toString();
    const name = role === Role.ADMIN 
      ? 'Administrator' 
      : (agentName || 'Unknown Agent');

    set({
      currentUser: { id, name, role },
      isAuthenticated: true,
      error: null,
      // No more broken authorizedAgents line
      // If you need authorizedAgents, it's already in initial state above
    });
  },

  logout: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
      requests: [],
      lastFetched: null,
      currentView: 'dashboard',
      error: null
    });
  },

  setView: (view: AppView) => set({ currentView: view, error: null }),
}));