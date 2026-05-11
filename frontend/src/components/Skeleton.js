import React from "react";
import { useTheme } from "@/context/ThemeContext";

function SkeletonPulse({ style }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div
      style={{
        background: isDark
          ? "linear-gradient(90deg, #1c2e22 25%, #243a2b 50%, #1c2e22 75%)"
          : "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

export function ProductCardSkeleton({ delay = 0 }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: isDark ? "#162419" : "#fff",
        borderRadius: 14,
        padding: "12px 14px",
        boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.15)" : "0 1px 4px rgba(27,67,50,0.06)",
        borderLeft: "3px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
        animation: `fadeInUp 0.4s ease ${delay}ms both`,
      }}
    >
      <SkeletonPulse style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
      <SkeletonPulse style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <SkeletonPulse style={{ width: "70%", height: 14, marginBottom: 6 }} />
        <SkeletonPulse style={{ width: "50%", height: 12 }} />
      </div>
      <div style={{ textAlign: "right" }}>
        <SkeletonPulse style={{ width: 40, height: 14, marginBottom: 4, marginLeft: "auto" }} />
        <SkeletonPulse style={{ width: 50, height: 12, marginLeft: "auto" }} />
      </div>
    </div>
  );
}

export function ProductListSkeleton({ count = 6 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} delay={i * 40} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
      }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "20px 18px",
            textAlign: "center",
          }}
        >
          <SkeletonPulse
            style={{ width: 36, height: 36, borderRadius: "50%", margin: "0 auto 8px" }}
          />
          <SkeletonPulse style={{ width: 60, height: 28, margin: "0 auto 8px" }} />
          <SkeletonPulse style={{ width: 80, height: 12, margin: "0 auto" }} />
        </div>
      ))}
    </div>
  );
}

export default SkeletonPulse;
