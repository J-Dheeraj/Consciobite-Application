import React from "react";

export default function Card({ children, isDark, style }) {
  return (
    <div
      style={{
        background: isDark ? "#162419" : "#fff",
        borderRadius: 14,
        padding: 24,
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
