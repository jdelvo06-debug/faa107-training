import { formatPercent } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  label: string;
  size?: number;
}

export function ProgressRing({ value, label, size = 112 }: ProgressRingProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="progress-ring-glow inline-flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 112 112" role="img" aria-label={`${label}: ${value}%`}>
        <circle cx="56" cy="56" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
        />
        <text x="56" y="62" textAnchor="middle" className="fill-foreground text-xl font-bold">
          {formatPercent(value)}
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">Course completion</p>
      </div>
    </div>
  );
}
