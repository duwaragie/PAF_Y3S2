import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: string;
  authProvider: string;
  emailVerified: boolean;
  studentRegistrationNumber?: string | null;
  employeeId?: string | null;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user, isAuthenticated: true }),
      logout: () => {
        const token = get().token;
        if (token) {
          axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => { /* best-effort: clear local state regardless */ });
        }
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
      },
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
