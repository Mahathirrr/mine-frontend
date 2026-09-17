import type { UserPreferences } from "@/lib/api/client";
import { resolveLandingPath } from "@/lib/navigation/mine-menu-catalog";
import type { AppPath } from "@/navigation/sidebar/sidebar-items";

export function postAuthPath(preferences: UserPreferences | null | undefined): AppPath {
  if (!preferences?.onboarding_completed) {
    return "/onboarding";
  }
  return resolveLandingPath(preferences);
}
