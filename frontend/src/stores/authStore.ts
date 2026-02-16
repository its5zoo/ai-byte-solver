import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences?: { theme?: string; language?: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) localStorage.setItem('token', state.token);
      },
    }
  )
);
