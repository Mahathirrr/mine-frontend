"use client";

import { cn } from "cn";

import type { FastingZone } from "@/lib/api/fasting";

import { zoneIcons } from "./fasting-utils";

type Props = {
  progress: number;
  elapsedHours: number;
  goalHours: number;
  size?: number;
  label: string;
  sublabel?: string;
  zoneLabel?: string;
  zoneIcon?: string;
  allZones?: FastingZone[];
};

function markerPosition(size: number, ringInset: number, fraction: number) {
  const r = size / 2 - ringInset;
  const angle = fraction * 2 * Math.PI - Math.PI / 2;
  return {
    left: size / 2 + r * Math.cos(angle),
    top: size / 2 + r * Math.sin(angle),
  };
}

export function FastingTimerRing({
  progress,
  elapsedHours,
  goalHours,
  size = 300,
  label,
  sublabel,
  zoneLabel,
  zoneIcon,
  allZones = [],
}: Props) {
  const clamped = Math.min(1, Math.max(0, progress));
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const cx = size / 2;
  const cy = size / 2;
  const head = markerPosition(size, stroke / 2 + 2, clamped);

  const milestones = allZones
    .filter((z) => z.end_hour < 72 && z.start_hour > 0 && z.start_hour < goalHours)
    .map((z) => ({ hour: z.start_hour, icon: zoneIcons[z.icon] ?? "•", label: z.label }));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-label="Fasting progress ring">
        <title>Fasting progress</title>
        <defs>
          <linearGradient id="fast-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <filter id="fast-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r + 3}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke + 8}
          className="text-black/[0.05] dark:text-white/[0.06]"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-black/[0.07] dark:text-white/[0.1]"
        />

        {clamped > 0.005 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#fast-ring-grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            filter="url(#fast-ring-glow)"
            className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
        )}
      </svg>

      {milestones.map((m) => {
        const frac = m.hour / goalHours;
        const pos = markerPosition(size, stroke / 2 + 2, frac);
        const reached = elapsedHours >= m.hour;
        const active = zoneLabel === m.label;
        return (
          <div
            key={m.hour}
            title={m.label}
            className={cn(
              "absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs transition-all duration-500",
              active && "size-9 bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.55)]",
              !active && reached && "bg-orange-500/20 text-base ring-1 ring-orange-500/40",
              !active && !reached && "bg-muted/80 text-muted-foreground/60 ring-1 ring-border/50",
            )}
            style={{ left: pos.left, top: pos.top }}
          >
            {m.icon}
          </div>
        );
      })}

      {clamped > 0.01 && (
        <div
          className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)] transition-all duration-1000"
          style={{ left: head.left, top: head.top }}
        />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        {zoneLabel && (
          <div className="mb-2 flex items-center gap-1.5 font-medium text-red-500 text-sm dark:text-red-400">
            {zoneIcon && <span className="text-base leading-none">{zoneIcon}</span>}
            <span>{zoneLabel}</span>
          </div>
        )}
        {sublabel && <p className="mb-1 text-[11px] text-muted-foreground uppercase tracking-[0.14em]">{sublabel}</p>}
        <p className="font-extralight text-[2.75rem] tabular-nums leading-none tracking-tight sm:text-[3.25rem]">
          {label}
        </p>
      </div>
    </div>
  );
}
