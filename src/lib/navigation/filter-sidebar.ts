import type { NavGroup, NavMainItem } from "@/navigation/sidebar/sidebar-items";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

function filterItem(item: NavMainItem, enabled: Set<string>): NavMainItem | null {
  if ("url" in item && item.url) {
    return enabled.has(item.id) ? item : null;
  }
  if ("subItems" in item && item.subItems) {
    const subItems = item.subItems.filter((sub) => enabled.has(sub.id));
    if (subItems.length === 0) return null;
    return { ...item, subItems };
  }
  return null;
}

export function filterSidebarItems(
  items: NavGroup[],
  enabledMenuItems: string[],
  showTemplatePages: boolean,
): NavGroup[] {
  const enabled = new Set(enabledMenuItems);

  return items
    .filter((group) => group.id === 0 || showTemplatePages)
    .map((group) => {
      if (group.id !== 0) return group;
      const filtered = group.items
        .map((item) => filterItem(item, enabled))
        .filter((item): item is NavMainItem => item != null);
      return { ...group, items: filtered };
    })
    .filter((group) => group.items.length > 0);
}

export function getFilteredSidebarItems(enabledMenuItems: string[], showTemplatePages: boolean) {
  return filterSidebarItems(sidebarItems, enabledMenuItems, showTemplatePages);
}
