import * as React from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { requireAuth } from "@/lib/auth/guard";
import { postAuthPath } from "@/lib/auth/post-auth-redirect";
import { privatePageHead } from "@/lib/seo/build-head";
import { AuthPageLayout } from "@/routes/(main)/auth/-components/auth-page-layout";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { OnboardingWizard } from "./-components/onboarding-wizard";

export const Route = createFileRoute("/(main)/onboarding")({
  ssr: false,
  head: () =>
    privatePageHead({
      title: "Onboarding | Mine",
      description: "Atur modul Mine yang ingin kamu gunakan.",
      path: "/onboarding",
    }),
  beforeLoad: () => {
    requireAuth();
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const initialized = useAuthStore((s) => s.initialized);
  const preferences = useAuthStore((s) => s.preferences);

  React.useEffect(() => {
    if (!initialized) return;
    if (preferences?.onboarding_completed) {
      void navigate({ to: postAuthPath(preferences), replace: true });
    }
  }, [initialized, preferences, navigate]);

  if (!initialized) return null;
  if (preferences?.onboarding_completed) return null;

  return (
    <AuthPageLayout>
      <div className="flex min-h-[70vh] w-full items-center justify-center px-4 py-10">
        <OnboardingWizard />
      </div>
    </AuthPageLayout>
  );
}
