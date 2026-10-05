"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import type { FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

import { formatDateTime, formatDurationShort, sessionDurationHours } from "./fasting-utils";

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function FastingHistoryPanel({ data, token, onRefresh }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data & history</CardTitle>
        <CardDescription>Timeline fasting session kamu</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {data.sessions.map((s) => {
            const hours = sessionDurationHours(s);
            return (
              <Item key={s.id} variant="outline">
                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">
                    {formatDurationShort(hours)} fasting
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                    <Badge variant="outline">{s.protocol_slug}</Badge>
                  </ItemTitle>
                  <ItemDescription>
                    {formatDateTime(s.started_at)}
                    {s.ended_at ? ` – ${formatDateTime(s.ended_at)}` : " · masih berjalan"}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {s.status !== "active" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={async () => {
                        await fastingApi.deleteSession(token, s.id);
                        await onRefresh();
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
