"use client";

import * as React from "react";

import { cn } from "cn";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { JournalTopic } from "@/lib/api/journal";

import { topicColor } from "./journal-utils";

type TopicWheelProps = {
  topics: JournalTopic[];
  spinning: boolean;
  result: JournalTopic | null;
  onSpin: () => void;
  onWrite: (topic: JournalTopic) => void;
};

function buildGradient(topics: JournalTopic[]): string {
  if (topics.length === 0) return "conic-gradient(#64748b 0deg 360deg)";
  const slice = 360 / topics.length;
  const stops = topics.map((topic, index) => {
    const color = topicColor(topic.color, index);
    const start = index * slice;
    const end = (index + 1) * slice;
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

export function TopicWheel({ topics, spinning, result, onSpin, onWrite }: TopicWheelProps) {
  const [rotation, setRotation] = React.useState(0);
  const activeTopics = topics.filter((t) => t.is_active);

  React.useEffect(() => {
    if (!result || activeTopics.length === 0) return;
    const index = activeTopics.findIndex((t) => t.id === result.id);
    if (index < 0) return;
    const slice = 360 / activeTopics.length;
    setRotation((prev) => {
      const base = prev + 360 * 5;
      return base + (360 - index * slice - slice / 2) - (base % 360);
    });
  }, [result, activeTopics]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div
          className={cn(
            "relative size-72 rounded-full border-4 border-background shadow-xl transition-transform duration-[4200ms] ease-out sm:size-80",
            spinning && "duration-[4200ms]",
          )}
          style={{
            background: buildGradient(activeTopics),
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <div className="absolute inset-4 rounded-full bg-background/95 backdrop-blur-sm" />
        </div>
        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
          <div className="size-0 border-x-8 border-x-transparent border-t-12 border-t-primary" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-background px-4 py-2 text-center shadow-md">
            <p className="font-medium text-sm">{spinning ? "Memutar…" : result ? "Hasil!" : "Spin topic"}</p>
          </div>
        </div>
      </div>

      <Button size="lg" disabled={spinning || activeTopics.length === 0} onClick={onSpin} className="min-w-40">
        <Sparkles className="size-4" />
        {spinning ? "Memutar…" : "Putar roda"}
      </Button>

      {result ? (
        <div className="w-full max-w-md rounded-xl border bg-muted/30 p-4 text-center">
          <p className="font-semibold text-lg">{result.title}</p>
          {result.prompt ? <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{result.prompt}</p> : null}
          <Button className="mt-4" onClick={() => onWrite(result)}>
            Mulai essay
          </Button>
        </div>
      ) : (
        <p className="max-w-sm text-center text-muted-foreground text-sm">
          {activeTopics.length === 0
            ? "Aktifkan minimal satu topik dulu di tab Topik."
            : `${activeTopics.length} topik siap — putar untuk dapat prompt acak.`}
        </p>
      )}
    </div>
  );
}
