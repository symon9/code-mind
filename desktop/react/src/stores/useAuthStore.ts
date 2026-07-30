import { create } from 'zustand';
import type { AuthUser } from '../types';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user: AuthUser, token: string) => {
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates: Partial<AuthUser>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },
}));
