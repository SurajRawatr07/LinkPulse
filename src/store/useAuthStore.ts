import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  init: () => Promise<void>;
  login: (email: string, passwordPlain: string) => Promise<User>;
  register: (name: string, email: string, passwordPlain: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),

  init: async () => {
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email: string, passwordPlain: string) => {
    const user = await authApi.login(email, passwordPlain);
    set({ user });
    return user;
  },

  register: async (name: string, email: string, passwordPlain: string) => {
    const user = await authApi.register(name, email, passwordPlain);
    set({ user });
    return user;
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
}));
