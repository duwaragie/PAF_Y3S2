import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: string;
  authProvider: string;
  isEmailVerified: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user, isAuthenticated: true }),
      logout: () => set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
