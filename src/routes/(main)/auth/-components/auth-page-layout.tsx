import type { ReactNode } from "react";

import { MineLogo } from "@/components/brand/mine-logo";
import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute top-10 space-y-1 px-10 text-primary-foreground">
            <div className="mb-2 flex items-center gap-3">
              <MineLogo size={40} variant="adaptive" className="text-primary-foreground drop-shadow-md" />
              <h1 className="font-bold font-brand text-2xl tracking-tight">{APP_CONFIG.name}</h1>
            </div>
            <p className="text-sm">Your personal productivity hub: track, plan, and grow.</p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Track everything</h2>
              <p className="text-sm">Interviews, tasks, and notes in one place.</p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Private by default</h2>
              <p className="text-sm">Your data stays yours. Sign in to sync across devices.</p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
