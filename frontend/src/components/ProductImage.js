import React from "react";

const CATEGORY_COLORS = {
  Protein: { bg: "#fef2f2", fg: "#e63946", accent: "#fca5a5" },
  Seafood: { bg: "#eff6ff", fg: "#3b82f6", accent: "#93c5fd" },
  "Dairy & Eggs": { bg: "#fffbeb", fg: "#d97706", accent: "#fcd34d" },
  Grains: { bg: "#fefce8", fg: "#a16207", accent: "#fde047" },
  Fruits: { bg: "#fdf2f8", fg: "#db2777", accent: "#f9a8d4" },
  Vegetables: { bg: "#ecfdf5", fg: "#059669", accent: "#6ee7b7" },
  Beverages: { bg: "#f0fdfa", fg: "#0d9488", accent: "#5eead4" },
  Snacks: { bg: "#fef3c7", fg: "#b45309", accent: "#fbbf24" },
  Pantry: { bg: "#f5f3ff", fg: "#7c3aed", accent: "#c4b5fd" },
};

const CATEGORY_ICONS = {
  Protein: "\uD83E\uDD69",
  Seafood: "\uD83D\uDC1F",
  "Dairy & Eggs": "\uD83E\uDD5B",
  Grains: "\uD83C\uDF3E",
  Fruits: "\uD83C\uDF53",
  Vegetables: "\uD83E\uDD66",
  Beverages: "\uD83E\uDDC3",
  Snacks: "\uD83C\uDF6A",
  Pantry: "\uD83C\uDF6F",
};

function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function ProductImage({ name, category, size = 48 }) {
  const colors = CATEGORY_COLORS[category] || { bg: "#f0fdf4", fg: "#2d6a4f", accent: "#95d5b2" };
  const icon = CATEGORY_ICONS[category] || "\uD83C\uDF3F";
  const hash = hashName(name || "");
  const rotation = (hash % 30) - 15;
  const patternIndex = hash % 3;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 60 ? 16 : 10,
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Background pattern */}
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
        {patternIndex === 0 && (
          <>
            <circle cx={size * 0.2} cy={size * 0.3} r={size * 0.08} fill={colors.accent} />
            <circle cx={size * 0.8} cy={size * 0.7} r={size * 0.06} fill={colors.accent} />
            <circle cx={size * 0.6} cy={size * 0.15} r={size * 0.04} fill={colors.accent} />
          </>
        )}
        {patternIndex === 1 && (
          <>
            <rect
              x={size * 0.1}
              y={size * 0.1}
              width={size * 0.15}
              height={size * 0.15}
              rx={3}
              fill={colors.accent}
              transform={`rotate(${rotation} ${size * 0.175} ${size * 0.175})`}
            />
            <rect
              x={size * 0.7}
              y={size * 0.6}
              width={size * 0.12}
              height={size * 0.12}
              rx={2}
              fill={colors.accent}
              transform={`rotate(${-rotation} ${size * 0.76} ${size * 0.66})`}
            />
          </>
        )}
        {patternIndex === 2 && (
          <path
            d={`M0,${size * 0.8} Q${size * 0.25},${size * 0.6} ${size * 0.5},${size * 0.75} T${size},${size * 0.65}`}
            stroke={colors.accent}
            strokeWidth={2}
            fill="none"
          />
        )}
      </svg>
      {/* Icon */}
      <span
        style={{
          fontSize: size * 0.45,
          position: "relative",
          zIndex: 1,
          transform: `rotate(${rotation * 0.3}deg)`,
        }}
      >
        {icon}
      </span>
    </div>
  );
}
