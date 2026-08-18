import { redirect } from "@tanstack/react-router";

import { getStoredToken } from "@/lib/auth/token";

export function requireAuth() {
  if (typeof window === "undefined") return;

  if (!getStoredToken()) {
    throw redirect({
      to: "/login",
      replace: true,
    });
  }
}

export function redirectIfAuthenticated() {
  if (typeof window === "undefined") return;

  if (getStoredToken()) {
    throw redirect({
      to: "/dashboard/leetcode",
      replace: true,
    });
  }
}
