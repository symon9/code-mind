import { create } from 'zustand';
import type { AuthUser } from '../types';
import { useToastStore } from './useToastStore';

// ─── Types & Helper ───────────────────────────────────────────────────────────

export type AuthView = 'editor' | 'login' | 'register';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  currentView: AuthView;
}

interface AuthActions {
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setCurrentView: (view: AuthView) => void;
}

type AuthStore = AuthState & AuthActions;

// Hydrate saved token & user from localStorage if present
const savedToken = localStorage.getItem('codemind-auth-token');
const savedUserRaw = localStorage.getItem('codemind-auth-user');
let initialUser: AuthUser | null = null;

if (savedUserRaw) {
  try {
    initialUser = JSON.parse(savedUserRaw);
  } catch (err) {
    console.error('Failed to parse stored user', err);
  }
}

// Initial route determination based on URL hash or stored auth
const getInitialView = (): AuthView => {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#/login' || hash === '#login') return 'login';
  if (hash === '#/register' || hash === '#register') return 'register';
  return 'editor';
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set) => ({
  user: initialUser,
  token: savedToken,
  isAuthenticated: !!savedToken,
  currentView: getInitialView(),

  login: (user: AuthUser, token: string) => {
    localStorage.setItem('codemind-auth-token', token);
    localStorage.setItem('codemind-auth-user', JSON.stringify(user));
    window.location.hash = '#/editor';

    set({ user, token, isAuthenticated: true, currentView: 'editor' });
    useToastStore.getState().addToast(`Logged in as ${user.name || user.email}`, 'success');
  },

  logout: () => {
    localStorage.removeItem('codemind-auth-token');
    localStorage.removeItem('codemind-auth-user');

    set({ user: null, token: null, isAuthenticated: false });
    useToastStore.getState().addToast('Logged out', 'info');
  },

  updateUser: (updates: Partial<AuthUser>) => {
    set((state) => {
      const updated = state.user ? { ...state.user, ...updates } : null;
      if (updated) {
        localStorage.setItem('codemind-auth-user', JSON.stringify(updated));
      }
      return { user: updated };
    });
  },

  setCurrentView: (currentView: AuthView) => {
    window.location.hash = `#/${currentView}`;
    set({ currentView });
  },
}));
