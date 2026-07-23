import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('nps_auth_token', token);
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nps_auth_token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        // Super admins have all permissions
        if (user.roles?.includes('Super Admin') || user.roles?.includes('super-admin')) return true;
        return user.permissions?.includes(permission) || false;
      },

      hasRole: (role: string) => {
        const { user } = get();
        if (!user) return false;
        return user.roles?.includes(role) || false;
      },

      hasSuperAdmin: () => {
        const { user } = get();
        if (!user) return false;
        return user.roles?.includes('Super Admin') || user.roles?.includes('super-admin') || false;
      },
    }),
    {
      name: 'nps-auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
      ),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
