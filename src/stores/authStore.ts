import { API_BASE_URL } from '../lib/api';
import { useCommissionStore } from './commissionStore';
import { create } from 'zustand';
import { User } from '../types';


interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}


export const useAuthStore = create<AuthState>((set) => {
  // Check for token in localStorage on app load
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isAuthenticated = !!token;
  return {
    user: null,
    isAuthenticated,
    token,
    login: async (username: string, password: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
          throw new Error('Invalid credentials');
        }
        const data = await response.json();
        set({
          user: { id: '', email: username, role: 'manager' }, // You can update this to match your backend response
          isAuthenticated: true,
          token: data.token,
        });
        localStorage.setItem('token', data.token);
      } catch (error) {
        throw new Error('Invalid credentials');
      }
    },
    logout: () => {
      set({ user: null, isAuthenticated: false, token: null });
      localStorage.removeItem('token');
      localStorage.removeItem('commission-storage');
      useCommissionStore.setState({ records: [], uploadedFiles: [], imeiNotes: new Map(), dismissedAlerts: new Set() });
    },
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("session-expired", () => useAuthStore.getState().logout());
}
