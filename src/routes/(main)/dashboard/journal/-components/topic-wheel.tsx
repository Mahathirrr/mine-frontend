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
  onSpinEnd: () => void;
  onWrite: (topic: JournalTopic) => void;
};

const WHEEL_SIZE = 320;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = CENTER - 8;
const LABEL_RADIUS = RADIUS * 0.62;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function hubLabel(spinning: boolean, hasResult: boolean): string {
  if (spinning) return "Putar…";
  if (hasResult) return "Selesai!";
  return "Spin";
}

export function TopicWheel({ topics, spinning, result, onSpin, onSpinEnd, onWrite }: TopicWheelProps) {
  const activeTopics = React.useMemo(() => topics.filter((t) => t.is_active), [topics]);
  const slice = activeTopics.length > 0 ? 360 / activeTopics.length : 360;
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = React.useState(0);
  const pendingIndex = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!result || activeTopics.length === 0) return;
    const index = activeTopics.findIndex((t) => t.id === result.id);
    if (index < 0) return;
    pendingIndex.current = index;

    const targetCenter = index * slice + slice / 2;
    const spins = 6;
    setRotation((prev) => {
      const normalized = ((prev % 360) + 360) % 360;
      const delta = spins * 360 + (360 - targetCenter) - normalized;
      return prev + delta;
    });
  }, [result, activeTopics, slice]);

  React.useEffect(() => {
    const node = wheelRef.current;
    if (!node) return;

    function handleEnd(event: TransitionEvent) {
      if (event.propertyName !== "transform") return;
      if (spinning && pendingIndex.current !== null) {
        pendingIndex.current = null;
        onSpinEnd();
      }
    }

    node.addEventListener("transitionend", handleEnd);
    return () => node.removeEventListener("transitionend", handleEnd);
  }, [spinning, onSpinEnd]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
          <div className="flex flex-col items-center">
            <div className="size-0 border-x-[14px] border-x-transparent border-t-[22px] border-t-primary drop-shadow-md" />
            <div className="mt-0.5 size-2.5 rounded-full bg-primary shadow-md" />
          </div>
        </div>

        <div
          ref={wheelRef}
          className={cn(
            "relative rounded-full shadow-2xl ring-4 ring-background",
            spinning ? "transition-transform duration-[4000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]" : "transition-none",
          )}
          style={{
            width: WHEEL_SIZE,
            height: WHEEL_SIZE,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <svg
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            className="block"
            role="img"
            aria-label="Roda topik essay"
          >
            <title>Roda topik essay</title>
            {activeTopics.map((topic, index) => {
              const start = index * slice;
              const end = (index + 1) * slice;
              const color = topicColor(topic.color, index);
              const mid = start + slice / 2;
              const labelPos = polarToCartesian(CENTER, CENTER, LABEL_RADIUS, mid);

              return (
                <g key={topic.id}>
                  <path
                    d={describeArc(CENTER, CENTER, RADIUS, start, end)}
                    fill={color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill="#fff"
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                  >
                    {truncate(topic.title, 14)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Center hub */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 flex-col items-center justify-center rounded-full border-4 border-background bg-card shadow-lg">
              <Sparkles className={cn("size-5 text-primary", spinning && "animate-pulse")} />
              <span className="mt-1 font-medium text-[10px] text-muted-foreground">
                {spinning ? "Putar…" : result ? "Selesai!" : "Spin"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button size="lg" disabled={spinning || activeTopics.length === 0} onClick={onSpin} className="min-w-44">
        <Sparkles className="size-4" />
        {spinning ? "Memutar…" : "Putar roda"}
      </Button>

      {result && !spinning ? (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2 rounded-xl border bg-muted/30 p-5 text-center duration-300">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">Topik terpilih</p>
          <p className="mt-1 font-semibold text-xl">{result.title}</p>
          {result.prompt ? <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{result.prompt}</p> : null}
          <Button className="mt-4" onClick={() => onWrite(result)}>
            Mulai essay
          </Button>
        </div>
      ) : (
        <p className="max-w-sm text-center text-muted-foreground text-sm">
          {activeTopics.length === 0
            ? "Aktifkan minimal satu topik di tab Topik."
            : `${activeTopics.length} topik siap — putar untuk dapat prompt acak.`}
        </p>
      )}
    </div>
  );
}
