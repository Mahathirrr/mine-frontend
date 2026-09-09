import { createStore } from "zustand/vanilla";

import { ApiError } from "@/lib/api/api-error";
import { api, type User } from "@/lib/api/client";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth/token";

export type AuthState = {
  token: string | null;
  user: User | null;
  initializing: boolean;
  submitting: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
};

export function createAuthStore() {
  return createStore<AuthState>((set, _get) => ({
    token: null,
    user: null,
    initializing: false,
    submitting: false,
    initialized: false,

    async login(email, password) {
      set({ submitting: true });
      try {
        const res = await api.login(email, password);
        setStoredToken(res.token);
        set({ token: res.token, user: res.user });
      } finally {
        set({ submitting: false });
      }
    },

    async register(name, email, password) {
      set({ submitting: true });
      try {
        const res = await api.register(name, email, password);
        setStoredToken(res.token);
        set({ token: res.token, user: res.user });
      } finally {
        set({ submitting: false });
      }
    },

    logout() {
      clearStoredToken();
      set({ token: null, user: null });
    },

    async init() {
      const token = getStoredToken();
      if (!token) {
        set({ token: null, user: null, initialized: true });
        return;
      }

      set({ token, initializing: true });
      try {
        const res = await api.me(token);
        set({ user: res.user });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearStoredToken();
          set({ token: null, user: null });
        }
      } finally {
        set({ initializing: false, initialized: true });
      }
    },
  }));
}

export type AuthStore = ReturnType<typeof createAuthStore>;
