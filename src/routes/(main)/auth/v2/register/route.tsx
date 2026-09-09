import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/auth/v2/register")({
  beforeLoad: () => {
    throw redirect({ to: "/register", replace: true });
  },
});
