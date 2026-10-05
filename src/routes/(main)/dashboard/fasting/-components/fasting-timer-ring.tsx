"use client";

import * as React from "react";

import { cn } from "cn";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FastingZone } from "@/lib/api/fasting";

import { formatDurationShort, zoneIcons } from "./fasting-utils";

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

/** Space for milestone badges + ambient aura outside the ring track */
const MARKER_PAD = 46;

function useRingSize(requested?: number) {
  const [size, setSize] = React.useState(requested ?? 276);

  React.useEffect(() => {
    if (requested != null) {
      setSize(requested);
      return;
    }
    const update = () => {
      const w = window.innerWidth;
      if (w < 400) setSize(248);
      else if (w < 640) setSize(264);
      else setSize(276);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [requested]);

  return size;
}

function ZoneStatus({
  reached,
  active,
  hour,
  elapsedHours,
}: {
  reached: boolean;
  active: boolean;
  hour: number;
  elapsedHours: number;
}) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-rose-500 dark:text-rose-400">
        <span className="size-1.5 animate-ping rounded-full bg-rose-500" />
        Zona aktif sekarang
      </span>
    );
  }
  if (!reached) {
    return (
      <span className="text-muted-foreground">
        Tersisa ~{formatDurationShort(Math.max(0, hour - elapsedHours))} menuju zona ini
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
      ✓ Sudah dilewati
    </span>
  );
}

function markerPosition(size: number, ringInset: number, fraction: number) {
  const r = size / 2 - ringInset;
  // Angle starts at top (-PI/2) and proceeds clockwise
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
  size: sizeProp,
  label,
  sublabel,
  zoneLabel,
  zoneIcon,
  allZones = [],
}: Props) {
  const size = useRingSize(sizeProp);
  const clamped = Math.min(1, Math.max(0, progress));
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const cx = size / 2;
  const cy = size / 2;
  const head = markerPosition(size, stroke / 2, clamped);

  // Collect unique milestone targets along the fast up to goalHours
  const milestones = React.useMemo(() => {
    if (!allZones || allZones.length === 0 || goalHours <= 0) return [];

    const list: Array<{ zone: FastingZone; hour: number; icon: string; frac: number }> = [];
    const seenAngles = new Set<string>();

    for (const z of allZones) {
      if (z.start_hour > 0 && z.start_hour <= goalHours && z.start_hour < 72) {
        const frac = Math.min(1, z.start_hour / goalHours);
        const angleKey = frac.toFixed(3);
        if (!seenAngles.has(angleKey)) {
          seenAngles.add(angleKey);
          list.push({
            zone: z,
            hour: z.start_hour,
            icon: zoneIcons[z.icon] ?? "⏱️",
            frac,
          });
        }
      }
    }

    return list.sort((a, b) => a.hour - b.hour);
  }, [allZones, goalHours]);

  const frame = size + MARKER_PAD * 2;

  return (
    <div
      className="relative mx-auto shrink-0 select-none overflow-visible"
      style={{ width: frame, height: frame, minWidth: frame, minHeight: frame }}
    >
      <svg
        width={size}
        height={size}
        className="absolute -rotate-90 overflow-visible"
        style={{ left: MARKER_PAD, top: MARKER_PAD }}
        aria-label="Fasting progress ring"
      >
        <title>Fasting progress</title>
        <defs>
          {/* Razor-sharp progress gradient */}
          <linearGradient id="fast-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="35%" stopColor="#f97316" />
            <stop offset="75%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Soft ambient aura filter (applied only to blurred underglow path) */}
          <filter id="fast-ambient-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
          </filter>
        </defs>

        {/* Base Track (Subtle dark matte ring) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-neutral-200/90 dark:text-[#2c272a]"
        />

        {/* Ambient Underglow (Keeps main stroke razor-sharp while providing a warm aura) */}
        {clamped > 0.01 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#fast-ring-grad)"
            strokeWidth={stroke + 6}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            filter="url(#fast-ambient-blur)"
            opacity={0.35}
            className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
        )}

        {/* Main Razor-Sharp Progress Stroke */}
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
            className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
        )}
      </svg>

      {/* Tactile Milestone Badges Along the Ring */}
      {milestones.map((m) => {
        const pos = markerPosition(size, stroke / 2, m.frac);
        const left = pos.left + MARKER_PAD;
        const top = pos.top + MARKER_PAD;
        const reached = elapsedHours >= m.hour;
        const active = zoneLabel === m.zone.label;
        const endLabel = m.zone.end_hour >= 72 ? "72h+" : `${m.zone.end_hour}h`;

        return (
          <Popover key={m.zone.slug}>
            <PopoverTrigger
              className={cn(
                "group absolute z-20 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                active && "scale-105",
                !active && "hover:scale-110",
              )}
              style={{ left, top }}
              aria-label={`${m.zone.label} milestone`}
            >
              {/* Active Ambient Halo Glow (matching reference image) */}
              {active && (
                <span className="pointer-events-none absolute -inset-2.5 animate-pulse rounded-full bg-rose-500/35 blur-md" />
              )}

              {/* Milestone Disc / Puck */}
              <span
                className={cn(
                  "relative flex size-full select-none items-center justify-center rounded-full text-lg transition-all duration-300 sm:text-xl",
                  // 1. Active state (rich glowing crimson/red gradient)
                  active &&
                    "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[0_4px_20px_rgba(244,63,94,0.65)] ring-4 ring-card dark:ring-[#161214]",
                  // 2. Reached state (passed milestones)
                  !active &&
                    reached &&
                    "bg-zinc-800 text-white shadow-md ring-2 ring-orange-500/70 dark:bg-[#2c272a] dark:shadow-[0_2px_12px_rgba(249,115,22,0.25)] dark:ring-orange-400/70",
                  // 3. Upcoming state (matte disc with subtle ring border)
                  !active &&
                    !reached &&
                    "bg-zinc-100 text-zinc-600 shadow-sm ring-2 ring-zinc-300 dark:bg-[#2c272a] dark:text-zinc-400 dark:shadow-md dark:ring-white/[0.08]",
                )}
              >
                {m.icon}
              </span>
            </PopoverTrigger>

            <PopoverContent
              side="top"
              className="w-68 rounded-2xl border border-border/60 bg-popover/95 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-xl">
                  {m.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{m.zone.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.zone.start_hour}h – {endLabel}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-muted-foreground text-xs leading-relaxed">{m.zone.description}</p>
              <div className="mt-3 flex items-center justify-between border-border/50 border-t pt-2.5 text-xs">
                <ZoneStatus reached={reached} active={active} hour={m.hour} elapsedHours={elapsedHours} />
              </div>
            </PopoverContent>
          </Popover>
        );
      })}

      {/* Leading Tip Indicator Bead */}
      {clamped > 0.01 && clamped < 0.995 && (
        <div
          className="pointer-events-none absolute z-20 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.9)] transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] dark:border-neutral-900"
          style={{ left: head.left + MARKER_PAD, top: head.top + MARKER_PAD }}
        />
      )}

      {/* Center Dashboard Info (Zone, Elapsed %, Big Digital Timer) */}
      <div
        className="pointer-events-none absolute z-10 flex select-none flex-col items-center justify-center px-4 text-center"
        style={{ left: MARKER_PAD, top: MARKER_PAD, width: size, height: size }}
      >
        {/* Active Zone Label + Icon */}
        {zoneLabel && (
          <div className="mb-2 flex items-center gap-1.5 font-bold text-orange-500 text-sm tracking-wide sm:text-base dark:text-orange-400">
            {zoneIcon && <span className="text-base leading-none sm:text-lg">{zoneIcon}</span>}
            <span>{zoneLabel}</span>
          </div>
        )}

        {/* Elapsed Time Subtitle */}
        {sublabel && (
          <p className="mb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            {sublabel}
          </p>
        )}

        {/* Main High-Contrast Digital Timer */}
        <p className="font-extrabold text-4xl text-foreground tabular-nums tracking-tight sm:text-5xl">{label}</p>

        {/* Micro-hint */}
        <p className="mt-2 text-[10px] text-muted-foreground/70">Ketuk icon di ring untuk info zona</p>
      </div>
    </div>
  );
}
