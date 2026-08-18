import { createContext, use, useEffect, useState } from "react";

import { type StoreApi, useStore } from "zustand";

import { type AuthState, createAuthStore } from "./auth-store";

const AuthStoreContext = createContext<StoreApi<AuthState> | null>(null);

export function AuthStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<StoreApi<AuthState>>(() => createAuthStore());

  useEffect(() => {
    void store.getState().init();
  }, [store]);

  return <AuthStoreContext.Provider value={store}>{children}</AuthStoreContext.Provider>;
}

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  const store = use(AuthStoreContext) as StoreApi<AuthState> | null;
  if (!store) throw new Error("Missing AuthStoreProvider");
  return useStore(store, selector);
}
