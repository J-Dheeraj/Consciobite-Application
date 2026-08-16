"use client";
import React from "react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { fetchProducts } from "@/services/products";
import PageHero from "@/components/PageHero";
import GradeBadge from "@/components/GradeBadge";
import { pageContainer, card } from "@/utils/pageStyles";
import { CATEGORY_ICONS, scoreColor } from "@/utils/constants";

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Beverages",
  "Snacks",
  "Pantry",
  "Dairy & Eggs",
  "Seafood",
  "Protein",
];

const RANK_MEDALS = ["🥇", "🥈", "🥉", "4", "5"];

function TierPill({ score, isDark }) {
  const color = scoreColor(score);
  const label = score >= 7 ? "Green" : score >= 4 ? "Amber" : "Red";
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        background: `${color}20`,
        color,
      }}
    >
      {label}
    </span>
  );
}

function CategoryCard({ category, products, isLoading, isDark }) {
  const icon = CATEGORY_ICONS[category] || "🌿";
  const borderColor = isDark ? "#2d4a35" : "#e5e7eb";
  const mutedColor = isDark ? "#6b8a6e" : "#aaa";

  return (
    <div
      style={{
        ...card(isDark, { radius: 16 }),
        display: "flex",
        flexDirection: "column",
        animation: "fadeInUp 0.4s ease both",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: 11, color: mutedColor }}>Top by GreenGrade</div>
        </div>
      </div>

      {/* Product list */}
      <div style={{ padding: "8px 0" }}>
        {isLoading ? (
          <div
            style={{ padding: "20px", textAlign: "center", color: mutedColor, fontSize: 13 }}
          >
            Loading...
          </div>
        ) : !products || products.length === 0 ? (
          <div
            style={{ padding: "20px", textAlign: "center", color: mutedColor, fontSize: 13 }}
          >
            No products found
          </div>
        ) : (
          products.map((product, idx) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 20px",
                  borderBottom: idx < products.length - 1 ? `1px solid ${borderColor}` : "none",
                  transition: "background 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = isDark
                    ? "rgba(116,198,157,0.06)"
                    : "rgba(45,106,79,0.04)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Rank */}
                <div
                  style={{
                    width: 24,
                    textAlign: "center",
                    fontSize: idx < 3 ? 16 : 12,
                    fontWeight: 700,
                    color: idx < 3 ? undefined : mutedColor,
                    flexShrink: 0,
                  }}
                >
                  {RANK_MEDALS[idx]}
                </div>

                {/* Score badge */}
                <GradeBadge
                  score={product.greenGrade?.score ?? 0}
                  color={product.greenGrade?.color ?? "red"}
                />

                {/* Name + tier */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.name}
                  </div>
                  <div style={{ marginTop: 3 }}>
                    <TierPill score={product.greenGrade?.score ?? 0} isDark={isDark} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer link */}
      <div
        style={{
          padding: "10px 20px",
          borderTop: `1px solid ${borderColor}`,
          marginTop: "auto",
        }}
      >
        <Link
          href={`/products?category=${encodeURIComponent(category)}&sort=grade_desc`}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#40916c",
            textDecoration: "none",
          }}
        >
          View all {category} products →
        </Link>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const results = useQueries({
    queries: CATEGORIES.map((category) => ({
      queryKey: ["leaderboard", category],
      queryFn: () => fetchProducts({ category, sort: "grade_desc", limit: 5 }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const overallTopProducts = results
    .flatMap((r) => (r.data?.products ?? []).slice(0, 1))
    .sort((a, b) => (b.greenGrade?.score ?? 0) - (a.greenGrade?.score ?? 0))
    .slice(0, 3);

  const isDone = results.every((r) => !r.isLoading);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🏆"
        title="GreenGrade Leaderboard"
        subtitle="Top-scoring products by category — ranked by environmental footprint across 7 supply-chain dimensions."
      />

      <div style={pageContainer(1200)}>
        {/* Top 3 overall banner */}
        {isDone && overallTopProducts.length > 0 && (
          <div
            style={{
              ...card(isDark, { radius: 16 }),
              padding: "20px 24px",
              marginBottom: 32,
              background: isDark
                ? "linear-gradient(135deg, #0d1f14, #162419)"
                : "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
              border: `1px solid ${isDark ? "#2d4a35" : "#bbf7d0"}`,
            }}
          >
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: isDark ? "#74c69d" : "#166534",
                marginBottom: 14,
              }}
            >
              Category Champions
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {overallTopProducts.map((product, idx) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  style={{ textDecoration: "none", flex: 1, minWidth: 180 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: isDark ? "rgba(116,198,157,0.06)" : "rgba(22,101,52,0.04)",
                      border: `1px solid ${isDark ? "#2d4a35" : "#bbf7d0"}`,
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = isDark
                        ? "rgba(116,198,157,0.12)"
                        : "rgba(22,101,52,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = isDark
                        ? "rgba(116,198,157,0.06)"
                        : "rgba(22,101,52,0.04)")
                    }
                  >
                    <span style={{ fontSize: 18 }}>{RANK_MEDALS[idx]}</span>
                    <GradeBadge
                      score={product.greenGrade?.score ?? 0}
                      color={product.greenGrade?.color ?? "red"}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: isDark ? "#e8f5e9" : "#1a3a2a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isDark ? "#6b8a6e" : "#888",
                          marginTop: 2,
                        }}
                      >
                        {product.category}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {CATEGORIES.map((category, idx) => (
            <CategoryCard
              key={category}
              category={category}
              products={results[idx].data?.products ?? []}
              isLoading={results[idx].isLoading}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Methodology note */}
        <div
          style={{
            marginTop: 32,
            padding: "16px 20px",
            borderRadius: 12,
            background: isDark ? "#0d1a10" : "#f8fdf9",
            border: `1px solid ${isDark ? "#2d4a35" : "#d1fae5"}`,
            fontSize: 12,
            color: isDark ? "#6b8a6e" : "#6b7280",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: isDark ? "#74c69d" : "#2d6a4f" }}>About GreenGrade:</strong>{" "}
          Scores are calculated using KDE-based statistical modelling across 7 emission dimensions
          (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail). A score of{" "}
          <strong>7–10</strong> is Green, <strong>4–6</strong> is Amber, and <strong>0–3</strong>{" "}
          is Red. See the{" "}
          <Link href="/methodology" style={{ color: "#40916c", textDecoration: "underline" }}>
            full methodology
          </Link>{" "}
          for details.
        </div>
      </div>
    </div>
  );
}
