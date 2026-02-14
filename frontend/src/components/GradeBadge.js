import React from "react";

const colorMap = {
  green: { ring: "#52b788", bg: "rgba(82,183,136,0.12)", text: "#2d6a4f", glow: "rgba(82,183,136,0.25)" },
  yellow: { ring: "#e9c46a", bg: "rgba(233,196,106,0.12)", text: "#8a6d00", glow: "rgba(233,196,106,0.25)" },
  red: { ring: "#e63946", bg: "rgba(230,57,70,0.10)", text: "#c5303c", glow: "rgba(230,57,70,0.20)" },
};

export default function GradeBadge({ score, color, size = "normal" }) {
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
    <div style={{ width: dim, height: dim, position: "relative", flexShrink: 0 }} title={`GreenGrade: ${score}/10`}>
      <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={center} cy={center} r={radius} fill={colors.bg} stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke={colors.ring} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize, color: colors.text, fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        {score}
      </div>
    </div>
  );
}
