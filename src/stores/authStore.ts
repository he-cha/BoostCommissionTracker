import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    // Mock authentication - V1.0
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    if (email === 'manager@boost.com' && password === 'demo123') {
      const user: User = {
        id: '1',
        email: email,
        role: 'manager',
      };
      set({ user, isAuthenticated: true });
    } else {
      throw new Error('Invalid credentials');
    }
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
