"use client";

import { useTheme } from "@/context/ThemeContext";

interface SkeletonPulseProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function SkeletonPulse({ style, className }: SkeletonPulseProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div
      className={className}
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

export function ProductCardSkeleton({ delay = 0 }: { delay?: number }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
      style={{
        background: isDark ? "#162419" : "#fff",
        boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.15)" : "0 1px 4px rgba(27,67,50,0.06)",
        borderLeft: `3px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
        animation: `fadeInUp 0.4s ease ${delay}ms both`,
      }}
    >
      <SkeletonPulse style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
      <SkeletonPulse style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
      <div className="flex-1">
        <SkeletonPulse style={{ width: "70%", height: 14, marginBottom: 6 }} />
        <SkeletonPulse style={{ width: "50%", height: 12 }} />
      </div>
      <div className="text-right">
        <SkeletonPulse style={{ width: 40, height: 14, marginBottom: 4, marginLeft: "auto" }} />
        <SkeletonPulse style={{ width: 50, height: 12, marginLeft: "auto" }} />
      </div>
    </div>
  );
}

export function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} delay={i * 40} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-2xl bg-card p-5 text-center">
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
