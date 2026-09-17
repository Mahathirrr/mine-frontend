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

const WHEEL_SIZE = 480;
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = CENTER - 14;
const INNER_RADIUS = 78;
const LABEL_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2;
const SLICE_GAP = 2.8;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function shadeColor(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const num = Number.parseInt(normalized, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
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
    <div className="flex flex-col items-center gap-8 py-2">
      <div className="relative">
        <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2">
          <div className="flex flex-col items-center">
            <div className="size-0 border-x-[16px] border-x-transparent border-t-[26px] border-t-primary drop-shadow-lg" />
            <div className="mt-0.5 size-3 rounded-full bg-primary shadow-md ring-2 ring-background" />
          </div>
        </div>

        <div
          className="relative rounded-full p-3 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)] ring-1 ring-foreground/10"
          style={{
            background: "radial-gradient(circle at 50% 45%, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
          }}
        >
          <div
            ref={wheelRef}
            className={cn(
              "relative aspect-square w-[min(480px,92vw)] rounded-full shadow-inner",
              spinning
                ? "transition-transform duration-[4000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                : "transition-none",
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
              className="block drop-shadow-md"
              role="img"
              aria-label="Roda topik essay"
            >
              <title>Roda topik essay</title>
              <defs>
                {activeTopics.map((topic, index) => {
                  const color = topicColor(topic.color, index);
                  return (
                    <linearGradient key={topic.id} id={`wheel-grad-${topic.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={shadeColor(color, 28)} />
                      <stop offset="55%" stopColor={color} />
                      <stop offset="100%" stopColor={shadeColor(color, -36)} />
                    </linearGradient>
                  );
                })}
                <filter id="wheel-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
                </filter>
              </defs>

              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS + 6}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
                opacity={0.35}
              />

              {activeTopics.map((topic, index) => {
                const start = index * slice + SLICE_GAP / 2;
                const end = (index + 1) * slice - SLICE_GAP / 2;
                const mid = start + (end - start) / 2;
                const labelPos = polarToCartesian(CENTER, CENTER, LABEL_RADIUS, mid);
                const fontSize = activeTopics.length > 10 ? 10 : activeTopics.length > 7 ? 11 : 12;

                return (
                  <g key={topic.id} filter="url(#wheel-soft-shadow)">
                    <path
                      d={describeDonutSlice(CENTER, CENTER, INNER_RADIUS, OUTER_RADIUS, start, end)}
                      fill={`url(#wheel-grad-${topic.id})`}
                      stroke="hsl(var(--background))"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#fff"
                      fontSize={fontSize}
                      fontWeight={600}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}
                    >
                      {truncate(topic.title, activeTopics.length > 8 ? 12 : 16)}
                    </text>
                  </g>
                );
              })}

              <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 2} fill="hsl(var(--background))" opacity={0.9} />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex size-[108px] flex-col items-center justify-center rounded-full border-[5px] border-background bg-gradient-to-b from-card to-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.25)]">
                <Sparkles className={cn("size-6 text-primary", spinning && "animate-pulse")} />
                <span className="mt-1.5 font-medium text-[11px] text-muted-foreground">
                  {hubLabel(spinning, Boolean(result))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button size="lg" disabled={spinning || activeTopics.length === 0} onClick={onSpin} className="min-w-48">
        <Sparkles className="size-4" />
        {spinning ? "Memutar…" : "Putar roda"}
      </Button>

      {result && !spinning ? (
        <div className="fade-in slide-in-from-bottom-2 w-full max-w-lg animate-in rounded-xl border bg-muted/30 p-6 text-center duration-300">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">Topik terpilih</p>
          <p className="mt-1 font-semibold text-2xl">{result.title}</p>
          {result.prompt ? <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{result.prompt}</p> : null}
          <Button className="mt-5" size="lg" onClick={() => onWrite(result)}>
            Mulai essay
          </Button>
        </div>
      ) : (
        <p className="max-w-md text-center text-muted-foreground text-sm leading-relaxed">
          {activeTopics.length === 0
            ? "Aktifkan minimal satu topik di tab Topik."
            : `${activeTopics.length} topik siap — putar untuk dapat prompt acak.`}
        </p>
      )}
    </div>
  );
}
