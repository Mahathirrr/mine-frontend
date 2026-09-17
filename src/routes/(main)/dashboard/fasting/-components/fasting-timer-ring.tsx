"use client";

type Props = {
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
  accent?: string;
};

export function FastingTimerRing({
  progress,
  size = 220,
  stroke = 14,
  label,
  sublabel,
  accent = "hsl(var(--primary))",
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-label="Fasting progress ring">
        <title>Fasting progress</title>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <p className="font-mono font-semibold text-3xl tabular-nums tracking-tight">{label}</p>
        {sublabel && <p className="mt-1 text-muted-foreground text-sm">{sublabel}</p>}
      </div>
    </div>
  );
}
