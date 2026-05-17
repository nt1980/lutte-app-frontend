import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User { id: string; email: string; name: string; globalRoles: string[]; }

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { data } = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        set({ user: data.user, token: data.token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      isAdmin: () => {
        const roles = get().user?.globalRoles || [];
        return roles.includes('super_admin') || roles.includes('admin');
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
