import { Link } from "@tanstack/react-router";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import type { FinanceInsight } from "@/lib/api/finance";

type FinanceNotificationProps = {
  insight: FinanceInsight | null;
};

export function FinanceNotification({ insight }: FinanceNotificationProps) {
  if (!insight) return null;

  return (
    <Item className="rounded-xl" variant="outline">
      <ItemMedia variant="icon">
        <Bell />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{insight.title}</ItemTitle>
        <ItemDescription>{insight.message}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {insight.type === "subscription" ? (
          <Button size="sm" variant="outline" asChild>
            <Link to="/dashboard/subscriptions">Lihat tagihan</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            Detail
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}
