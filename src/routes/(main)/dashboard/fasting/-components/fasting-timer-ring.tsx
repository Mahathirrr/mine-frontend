"use client";

type Props = {
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
  zoneLabel?: string;
  zoneIcon?: string;
  goalHours?: number;
};

export function FastingTimerRing({
  progress,
  size = 280,
  stroke = 18,
  label,
  sublabel,
  zoneLabel,
  zoneIcon,
  goalHours,
}: Props) {
  const clamped = Math.min(1, Math.max(0, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const cx = size / 2;
  const cy = size / 2;

  const angle = clamped * 2 * Math.PI - Math.PI / 2;
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy + r * Math.sin(angle);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-[6%] rounded-full bg-gradient-to-b from-orange-500/[0.07] to-transparent blur-[1px]"
        aria-hidden
      />

      <svg width={size} height={size} className="-rotate-90 drop-shadow-sm" aria-label="Fasting progress ring">
        <title>Fasting progress</title>
        <defs>
          <linearGradient id="fasting-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <filter id="fasting-ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-orange-500/10 dark:text-orange-500/15"
        />

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#fasting-ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          filter="url(#fasting-ring-glow)"
          className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
        />

        {clamped > 0.01 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={stroke / 2 + 2}
            fill="#fff"
            stroke="#f97316"
            strokeWidth={3}
            className="transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] dark:fill-orange-950"
          />
        )}
      </svg>

      {goalHours != null && goalHours > 0 && (
        <div className="absolute top-3 right-3 rounded-full border border-orange-500/20 bg-background/80 px-2.5 py-1 font-semibold text-orange-600 text-xs shadow-sm backdrop-blur-sm dark:text-orange-400">
          {goalHours}h
        </div>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {zoneLabel && (
          <div className="mb-2 flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 font-medium text-orange-700 text-sm dark:text-orange-300">
            {zoneIcon && <span className="text-base leading-none">{zoneIcon}</span>}
            <span>{zoneLabel}</span>
          </div>
        )}
        <p className="font-light text-5xl tabular-nums tracking-tight sm:text-[3.25rem]">{label}</p>
        {sublabel && <p className="mt-2 text-muted-foreground text-sm tracking-wide">{sublabel}</p>}
      </div>
    </div>
  );
}
