import { useId } from "react";

type MineLogoProps = {
  className?: string;
  size?: number;
  variant?: "brand" | "adaptive";
};

/**
 * Three glass slabs, bottom-left → top-right.
 * Rounded rectangles with a bevel rim — not capsules, not a baseline chart.
 */
const SLABS = [
  { x: 5, y: 18, w: 12, h: 24 },
  { x: 16, y: 11, w: 12, h: 27 },
  { x: 27, y: 5, w: 12, h: 30 },
] as const;

const CORNER = 3.1;
const INSET = 1.15;

type SlabProps = {
  uid: string;
  x: number;
  y: number;
  w: number;
  h: number;
  variant: "brand" | "adaptive";
  index: number;
};

function GlassSlab({ uid, x, y, w, h, variant, index }: SlabProps) {
  const isBrand = variant === "brand";
  const clipId = `${uid}-face-${index}`;
  const innerX = x + INSET;
  const innerY = y + INSET;
  const innerW = w - INSET * 2;
  const innerH = h - INSET * 2;
  const innerR = Math.max(CORNER - INSET, 1.6);

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={innerR} />
        </clipPath>
      </defs>

      {/* Bevel rim — light catches the top-left edge */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={CORNER}
        fill={isBrand ? `url(#${uid}-rim)` : `url(#${uid}-rim-adaptive)`}
      />

      {/* Inner glass face */}
      <rect
        x={innerX}
        y={innerY}
        width={innerW}
        height={innerH}
        rx={innerR}
        fill={isBrand ? `url(#${uid}-face)` : `url(#${uid}-face-adaptive)`}
      />

      {/* Soft face sheen */}
      <rect
        x={innerX}
        y={innerY}
        width={innerW}
        height={innerH * 0.55}
        rx={innerR}
        fill={isBrand ? `url(#${uid}-sheen)` : `url(#${uid}-sheen-adaptive)`}
        clipPath={`url(#${clipId})`}
      />

      {/* Specular on the top-left curve */}
      <ellipse
        cx={innerX + innerW * 0.28}
        cy={innerY + 3.4}
        rx={2.6}
        ry={1.5}
        fill="#fff"
        opacity={isBrand ? 0.55 : 0.7}
        clipPath={`url(#${clipId})`}
      />
    </g>
  );
}

export function MineLogo({ className, size = 32, variant = "brand" }: MineLogoProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d7efe4" />
          <stop offset="38%" stopColor="#6eae8e" />
          <stop offset="100%" stopColor="#163328" />
        </linearGradient>
        <linearGradient id={`${uid}-face`} x1="18%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#2f5f4a" />
          <stop offset="55%" stopColor="#1a3b2e" />
          <stop offset="100%" stopColor="#0c1f18" />
        </linearGradient>
        <linearGradient id={`${uid}-sheen`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`${uid}-rim-adaptive`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={`${uid}-face-adaptive`} x1="18%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${uid}-sheen-adaptive`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id={`${uid}-lift`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.1" floodColor="#0a1c14" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#${uid}-lift)`}>
        {SLABS.map((slab, index) => (
          <GlassSlab key={slab.x} uid={uid} {...slab} variant={variant} index={index} />
        ))}
      </g>
    </svg>
  );
}
