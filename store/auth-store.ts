import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  pendingAdminAuth: { user: User; token: string } | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setPendingAuth: (user: User, token: string) => void;
  clearPendingAuth: () => void;
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
      pendingAdminAuth: null,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setPendingAuth: (user, token) => set({ pendingAdminAuth: { user, token } }),
      clearPendingAuth: () => set({ pendingAdminAuth: null }),

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
        set({ user: null, token: null, isAuthenticated: false, pendingAdminAuth: null });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        // Super admins have all permissions
        if (user.role === 'Super Admin' || user.roles?.includes('Super Admin') || user.roles?.includes('super-admin')) return true;
        const perms = Array.isArray(user.permissions) ? user.permissions : [];
        if (perms.includes('*') || perms.includes(permission)) return true;

        // Aliases for manage vs view
        if (permission === 'manage-users' && perms.includes('view-users')) return true;
        if (permission === 'manage-roles' && perms.includes('view-roles')) return true;
        if (permission === 'manage-categories' && perms.includes('view-categories')) return true;
        if (permission === 'manage-brands' && perms.includes('view-brands')) return true;
        if (permission === 'view-reports' && (perms.includes('reports.page.access') || perms.some((p: string) => p.startsWith('reports.')))) return true;
        return false;
      },

      hasRole: (role: string) => {
        const { user } = get();
        if (!user) return false;
        return user.role === role || user.roles?.includes(role) || false;
      },

      hasSuperAdmin: () => {
        const { user } = get();
        if (!user) return false;
        return user.role === 'Super Admin' || user.roles?.includes('Super Admin') || user.roles?.includes('super-admin') || false;
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
