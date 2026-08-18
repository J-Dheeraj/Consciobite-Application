"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchLeaderboard } from "@/services/api";
import { CATEGORY_ICONS, scoreColor } from "@/utils/constants";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer } from "@/utils/pageStyles";

const RANK_MEDALS = ["🥇", "🥈", "🥉", "4th", "5th"];

function TierBadge({ tier, isDark }) {
  const colors = {
    green: { bg: isDark ? "#1a3a2a" : "#ecfdf5", text: "#2d6a4f" },
    amber: { bg: isDark ? "#3a2e1c" : "#fef3c7", text: "#92400e" },
    red: { bg: isDark ? "#3a1c1c" : "#fee2e2", text: "#991b1b" },
  };
  const style = colors[tier] || colors.amber;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 8,
        background: style.bg,
        color: style.text,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {tier}
    </span>
  );
}

function ProductRow({ product, isDark }) {
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textSecondary = isDark ? "rgba(255,255,255,0.5)" : "#666";

  return (
    <Link
      href={`/product/${product.id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: `1px solid ${cardBorder}`,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(45,106,79,0.04)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ fontSize: product.rank <= 3 ? 22 : 14, minWidth: 28, textAlign: "center" }}>
          {RANK_MEDALS[product.rank - 1]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.name}
          </div>
          <div style={{ fontSize: 12, color: textSecondary }}>{product.brand}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <TierBadge tier={product.tier} isDark={isDark} />
          <span
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: scoreColor(product.score),
              minWidth: 32,
              textAlign: "right",
            }}
          >
            {product.score.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({ cat, isSelected, onClick, isDark }) {
  const icon = CATEGORY_ICONS[cat.category] || "🌿";
  const bg = isDark ? "#14352a" : "#fff";
  const selectedBg = isDark ? "#1c4030" : "#ecfdf5";
  const border = isSelected
    ? "2px solid #2d6a4f"
    : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;

  return (
    <button
      onClick={onClick}
      style={{
        background: isSelected ? selectedBg : bg,
        border,
        borderRadius: 12,
        padding: "10px 16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.15s",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: isDark ? "#e8f5e9" : "#1a3a2a",
          }}
        >
          {cat.category}
        </div>
        <div style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#888" }}>
          avg {cat.avgScore.toFixed(1)} · {cat.total} products
        </div>
      </div>
    </button>
  );
}

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 5 * 60 * 1000,
  });

  const categories = data?.categories ?? [];
  const activeCategory = selected ?? (categories[0]?.category || null);
  const activeCat = categories.find((c) => c.category === activeCategory);

  const bg = isDark ? "#0a0a0a" : "#f8f9fa";
  const cardBg = isDark ? "#14352a" : "#fff";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "#888";

  return (
    <div style={{ background: bg, minHeight: "100vh", animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🏆"
        title="Category Leaderboard"
        subtitle="Top-scoring products by GreenGrade within each food category."
      />

      <div style={pageContainer(900)}>
        {isLoading && <Spinner message="Loading leaderboard..." />}
        {isError && (
          <p style={{ color: "#e74c3c", textAlign: "center" }}>
            Failed to load leaderboard. Please try again.
          </p>
        )}

        {!isLoading && !isError && categories.length > 0 && (
          <div>
            {/* Category selector */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.category}
                  cat={cat}
                  isSelected={cat.category === activeCategory}
                  onClick={() => setSelected(cat.category)}
                  isDark={isDark}
                />
              ))}
            </div>

            {/* Top products for selected category */}
            {activeCat && (
              <div
                style={{
                  background: cardBg,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(27,67,50,0.08)",
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: textPrimary,
                        margin: 0,
                      }}
                    >
                      {CATEGORY_ICONS[activeCat.category] || "🌿"} {activeCat.category}
                    </h2>
                    <p style={{ margin: 0, fontSize: 12, color: textMuted, marginTop: 2 }}>
                      Category average: {activeCat.avgScore.toFixed(1)} · {activeCat.total} products
                    </p>
                  </div>
                  <Link
                    href={`/products?category=${encodeURIComponent(activeCat.category)}&sort=grade_desc`}
                    style={{
                      fontSize: 13,
                      color: "#2d6a4f",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    View all →
                  </Link>
                </div>

                {/* Product rows */}
                {activeCat.top.map((product) => (
                  <ProductRow key={product.id} product={product} isDark={isDark} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
