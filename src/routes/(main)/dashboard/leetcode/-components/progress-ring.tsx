"use client";

import { cn } from "cn";

type ProgressRingProps = {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
};

export function ProgressRing({
  percent,
  size = 100,
  stroke = 8,
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;

  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-bold text-xl tabular-nums leading-none">{percent}%</span>
        {label ? <span className="mt-0.5 text-[10px] text-muted-foreground">{label}</span> : null}
        {sublabel ? <span className="text-[9px] text-muted-foreground tabular-nums">{sublabel}</span> : null}
      </div>
    </div>
  );
}
