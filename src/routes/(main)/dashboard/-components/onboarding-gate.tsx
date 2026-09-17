"use client";

import * as React from "react";

import { useNavigate } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth/auth-provider";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const initialized = useAuthStore((s) => s.initialized);
  const initializing = useAuthStore((s) => s.initializing);
  const preferences = useAuthStore((s) => s.preferences);

  React.useEffect(() => {
    if (!initialized) return;
    if (preferences && !preferences.onboarding_completed) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [initialized, preferences, navigate]);

  if (!initialized || initializing) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (preferences && !preferences.onboarding_completed) {
    return null;
  }

  return <>{children}</>;
}
