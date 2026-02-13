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

  // Actions
  fetchRequests: (force?: boolean) => Promise<void>;
  createRequest: (data: Partial<WorkRequest>) => Promise<void>;
  updateRequest: (id: string, updates: Partial<WorkRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  addComment: (requestId: string, content: string, type: CommentType) => Promise<void>;
  login: (role: Role) => void;
  logout: () => void;
  setView: (view: AppView) => void;
}

export const useStore = create<AppState>((set, get) => ({
  requests: [],
  currentUser: null,
  isAuthenticated: false,
  lastFetched: null,
  isLoading: false,
  error: null,
  currentView: 'dashboard',

  fetchRequests: async (force = false) => {
    const { lastFetched } = get();
    const now = Date.now();

    if (!force && lastFetched && now - lastFetched < CACHE_TIME) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await apiService.getWorkRequests();
      set({ requests: data, lastFetched: now, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createRequest: async (data) => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ isLoading: true });

    try {
      const newRequest = await apiService.createWorkRequest(data, currentUser);
      set((state) => ({
        requests: [...state.requests, newRequest],
        lastFetched: null,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateRequest: async (id, updates) => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ isLoading: true });

    try {
      const updated = await apiService.updateWorkRequest(id, updates, currentUser);
      set((state) => ({
        requests: state.requests.map((r) => (r.id === id ? updated : r)),
        lastFetched: null,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteRequest: async (id) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      throw new Error('Access Denied: Administrative privileges required.');
    }

    try {
      await apiService.deleteWorkRequest(id, currentUser);
      set((state) => ({
        requests: state.requests.filter((r) => r.id !== id),
        lastFetched: null,
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  addComment: async (requestId: string, content: string, type: CommentType) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const updated = await apiService.addComment(requestId, content, type, currentUser);
      set((state) => ({
        requests: state.requests.map((r) => (r.id === requestId ? updated : r)),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  login: (role: Role) => {
    const id = Date.now().toString();
    const name = role === Role.ADMIN ? 'Administrator' : 'AGT-109';
    set({
      currentUser: { id, name, role },
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
      requests: [],
      lastFetched: null,
      currentView: 'dashboard',
    });
  },

  setView: (view: AppView) => set({ currentView: view }),
}));
