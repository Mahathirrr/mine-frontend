import { createStore } from "zustand/vanilla";

import { ApiError } from "@/lib/api/api-error";
import { api, type User, type UserPreferences } from "@/lib/api/client";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth/token";

export type AuthState = {
  token: string | null;
  user: User | null;
  preferences: UserPreferences | null;
  initializing: boolean;
  submitting: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<UserPreferences | null>;
  register: (name: string, email: string, password: string) => Promise<UserPreferences | null>;
  logout: () => void;
  init: () => Promise<void>;
  updatePreferences: (
    body: Partial<{
      enabled_menu_items: string[];
      show_template_pages: boolean;
      landing_path: string | null;
      onboarding_completed: boolean;
    }>,
  ) => Promise<UserPreferences>;
  uploadAvatar: (file: File) => Promise<User>;
  deleteAvatar: () => Promise<User>;
};

export function createAuthStore() {
  return createStore<AuthState>((set, get) => ({
    token: null,
    user: null,
    preferences: null,
    initializing: false,
    submitting: false,
    initialized: false,

    async login(email, password) {
      set({ submitting: true });
      try {
        const res = await api.login(email, password);
        setStoredToken(res.token);
        set({ token: res.token, user: res.user, preferences: res.preferences ?? null });
        return res.preferences ?? null;
      } finally {
        set({ submitting: false });
      }
    },

    async register(name, email, password) {
      set({ submitting: true });
      try {
        const res = await api.register(name, email, password);
        setStoredToken(res.token);
        set({ token: res.token, user: res.user, preferences: res.preferences ?? null });
        return res.preferences ?? null;
      } finally {
        set({ submitting: false });
      }
    },

    logout() {
      clearStoredToken();
      set({ token: null, user: null, preferences: null });
    },

    async init() {
      const token = getStoredToken();
      if (!token) {
        set({ token: null, user: null, preferences: null, initialized: true });
        return;
      }

      set({ token, initializing: true });
      try {
        const res = await api.me(token);
        set({ user: res.user, preferences: res.preferences });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearStoredToken();
          set({ token: null, user: null, preferences: null });
        }
      } finally {
        set({ initializing: false, initialized: true });
      }
    },

    async updatePreferences(body) {
      const token = get().token;
      if (!token) throw new Error("Not authenticated");
      const res = await api.updatePreferences(token, body);
      set({ preferences: res.preferences });
      return res.preferences;
    },

    async uploadAvatar(file) {
      const token = get().token;
      if (!token) throw new Error("Not authenticated");
      const res = await api.uploadAvatar(token, file);
      set({ user: res.user });
      return res.user;
    },

    async deleteAvatar() {
      const token = get().token;
      if (!token) throw new Error("Not authenticated");
      const res = await api.deleteAvatar(token);
      set({ user: res.user });
      return res.user;
    },
  }));
}

export type AuthStore = ReturnType<typeof createAuthStore>;
