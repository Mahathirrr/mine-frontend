import { Link } from "@tanstack/react-router";

import { useShallow } from "zustand/react/shallow";

import { MineLogo } from "@/components/brand/mine-logo";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { getFilteredSidebarItems } from "@/lib/navigation/filter-sidebar";
import { resolveLandingPath } from "@/lib/navigation/mine-menu-catalog";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { useAuthStore } from "@/stores/auth/auth-provider";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SupportCard } from "./support-card";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;
  const authUser = useAuthStore((s) => s.user);
  const preferences = useAuthStore((s) => s.preferences);

  const visibleItems = preferences
    ? getFilteredSidebarItems(preferences.enabled_menu_items, preferences.show_template_pages)
    : sidebarItems;

  const homePath = preferences ? resolveLandingPath(preferences) : "/dashboard";

  const sidebarUser = authUser
    ? { name: authUser.name, email: authUser.email, avatar: authUser.avatar?.thumb_url ?? "" }
    : { name: "Guest", email: "", avatar: "" };

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader className="p-2">
        <Link
          to={homePath}
          className="flex h-14 w-full items-center gap-3 rounded-lg px-3 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
        >
          <MineLogo size={44} variant="brand" className="size-11 shrink-0 group-data-[collapsible=icon]:size-9" />
          <span className="font-bold font-brand text-2xl text-sidebar-foreground leading-none tracking-tight group-data-[collapsible=icon]:hidden">
            {APP_CONFIG.name}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleItems} />
      </SidebarContent>
      <SidebarFooter>
        <SupportCard />
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
