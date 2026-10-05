import { useEffect } from "react";

import { useNavigate } from "@tanstack/react-router";

import { postAuthPath } from "@/lib/auth/post-auth-redirect";
import { useAuthStore } from "@/stores/auth/auth-provider";

export function useRedirectIfAuthenticated() {
  const navigate = useNavigate();
  const initialized = useAuthStore((s) => s.initialized);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const preferences = useAuthStore((s) => s.preferences);

  useEffect(() => {
    if (initialized && token && user) {
      void navigate({ to: postAuthPath(preferences), replace: true });
    }
  }, [initialized, token, user, preferences, navigate]);
}
