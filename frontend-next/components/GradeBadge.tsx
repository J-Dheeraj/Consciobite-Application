import { memo } from "react";

type GradeColor = "green" | "yellow" | "red";

const colorMap: Record<GradeColor, { ring: string; bg: string; text: string; glow: string }> = {
  green: {
    ring: "#52b788",
    bg: "rgba(82,183,136,0.12)",
    text: "#2d6a4f",
    glow: "rgba(82,183,136,0.25)",
  },
  yellow: {
    ring: "#e9c46a",
    bg: "rgba(233,196,106,0.12)",
    text: "#8a6d00",
    glow: "rgba(233,196,106,0.25)",
  },
  red: {
    ring: "#e63946",
    bg: "rgba(230,57,70,0.10)",
    text: "#c5303c",
    glow: "rgba(230,57,70,0.20)",
  },
};

interface GradeBadgeProps {
  score: number;
  color: GradeColor;
  size?: "normal" | "large";
}

function GradeBadge({ score, color, size = "normal" }: GradeBadgeProps) {
  const colors = colorMap[color] || colorMap.yellow;
  const dim = size === "large" ? 88 : 48;
  const fontSize = size === "large" ? "1.5rem" : "0.95rem";
  const strokeWidth = size === "large" ? 3.5 : 3;
  const radius = size === "large" ? 36 : 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;
  const center = dim / 2;

  return (
    <div
      className="relative shrink-0"
      style={{ width: dim, height: dim }}
      title={`GreenGrade: ${score}/10`}
    >
      <svg width={dim} height={dim} data-testid="badge-svg" className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill={colors.bg}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.8s ease",
            filter: `drop-shadow(0 0 4px ${colors.glow})`,
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ fontSize, color: colors.text }}
      >
        {score}
      </div>
    </div>
  );
}

export default memo(GradeBadge);
