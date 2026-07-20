"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaders } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY_ICONS, scoreColor } from "@/utils/constants";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";

const LIMIT_OPTIONS = [3, 5, 10];

export default function Leaderboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [limit, setLimit] = useState(5);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["leaders", limit],
    queryFn: () => fetchLeaders(limit),
    staleTime: 5 * 60 * 1000,
  });

  const bg = isDark ? "#0a0a0a" : "#f8f9fa";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "#555";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "#888";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const rankBg = isDark ? "rgba(45,106,79,0.2)" : "#edf7f0";

  const leaders = data?.leaders || {};
  const categories = Object.keys(leaders).sort();

  return (
    <div style={{ background: bg, minHeight: "100vh", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <PageHero
          title="GreenGrade Leaderboard"
          subtitle="Top-rated eco-friendly products by category"
        />

        {/* Limit selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: textSecondary, fontSize: "0.9rem", fontWeight: 500 }}>
            Show top
          </span>
          {LIMIT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: `1.5px solid ${limit === n ? "#2d6a4f" : inputBorder}`,
                background: limit === n ? (isDark ? "rgba(45,106,79,0.25)" : "#edf7f0") : inputBg,
                color: limit === n ? "#2d6a4f" : textSecondary,
                fontWeight: limit === n ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
          <span style={{ color: textSecondary, fontSize: "0.9rem", fontWeight: 500 }}>
            per category
          </span>
        </div>

        {isLoading && (
          <div style={{ padding: 64, display: "flex", justifyContent: "center" }}>
            <Spinner />
          </div>
        )}

        {isError && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              background: isDark ? "rgba(231,76,60,0.15)" : "#fef2f2",
              color: "#e74c3c",
              fontSize: "0.9rem",
            }}
          >
            {error?.message || "Failed to load leaderboard. Make sure the API is running."}
          </div>
        )}

        {!isLoading && !isError && categories.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {categories.map((cat) => {
              const icon = CATEGORY_ICONS[cat] || "🌿";
              const products = leaders[cat] || [];
              return (
                <div
                  key={cat}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  {/* Category header */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: `1px solid ${cardBorder}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>{icon}</span>
                    <div>
                      <div
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: textPrimary,
                        }}
                      >
                        {cat}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: textMuted }}>
                        Top {products.length} by GreenGrade
                      </div>
                    </div>
                  </div>

                  {/* Product list */}
                  <div style={{ padding: "8px 0" }}>
                    {products.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => router.push(`/product/${p.id}`)}
                        style={{
                          width: "100%",
                          background: "none",
                          border: "none",
                          padding: "10px 20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.03)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        {/* Rank badge */}
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: idx === 0 ? rankBg : "transparent",
                            color: idx === 0 ? "#2d6a4f" : textMuted,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>

                        {/* Name + brand */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: 600,
                              color: textPrimary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: textMuted }}>{p.brand}</div>
                        </div>

                        {/* Score badge */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: scoreColor(p.score),
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {p.score}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
