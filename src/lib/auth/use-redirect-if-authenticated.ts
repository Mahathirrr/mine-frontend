import { useEffect } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useAuthStore } from "@/stores/auth/auth-provider";

export function useRedirectIfAuthenticated() {
  const navigate = useNavigate();
  const initialized = useAuthStore((s) => s.initialized);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (initialized && token && user) {
      void navigate({ to: "/dashboard/leetcode", replace: true });
    }
  }, [initialized, token, user, navigate]);
}
