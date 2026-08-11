"use client";
import React from "react";
import Link from "next/link";
import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchProducts } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY_ICONS } from "@/utils/constants";
import GradeBadge from "@/components/GradeBadge";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";

const CATEGORIES = [
  "Beverages",
  "Dairy & Eggs",
  "Fruits",
  "Grains",
  "Pantry",
  "Protein",
  "Seafood",
  "Snacks",
  "Vegetables",
];

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

function gradeColor(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

function RankBadge({ rank, isDark }) {
  const medal = RANK_MEDAL[rank - 1];
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: medal ? "1.1rem" : "0.8rem",
        color: isDark ? "rgba(255,255,255,0.5)" : "#888",
        flexShrink: 0,
      }}
    >
      {medal ?? rank}
    </div>
  );
}

function ProductRow({ rank, product, isDark, textPrimary, textSecondary, cardBg, cardBorder }) {
  const score = product.greenGrade?.score ?? 0;
  return (
    <Link
      href={`/product/${product.id}`}
      style={{ textDecoration: "none" }}
      aria-label={`${product.name} — GreenGrade ${score}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 4px 16px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(27,67,50,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <RankBadge rank={rank} isDark={isDark} />
        <GradeBadge score={score} color={gradeColor(score)} size="normal" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.name}
          </div>
          <div style={{ fontSize: "0.8rem", color: textSecondary }}>
            {product.brand} &middot; {product.category}
          </div>
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: textSecondary,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>{product.greenGrade?.totalEmissions?.toFixed(2) ?? "—"}</span>
          <span style={{ fontSize: "0.7rem" }}>kg CO₂e</span>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({
  category,
  products,
  isDark,
  textPrimary,
  textSecondary,
  cardBg,
  cardBorder,
}) {
  const icon = CATEGORY_ICONS[category] ?? "🌿";
  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: textPrimary,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{icon}</span>
          {category}
        </h3>
        <Link
          href={`/products?category=${encodeURIComponent(category)}&sort=grade_desc`}
          style={{
            fontSize: "0.75rem",
            color: "#52b788",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          View all →
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {products.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: textSecondary, margin: 0 }}>No products found.</p>
        ) : (
          products.map((product, i) => {
            const score = product.greenGrade?.score ?? 0;
            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 8px",
                    borderRadius: 8,
                    transition: "background 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: textSecondary,
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {RANK_MEDAL[i] ?? `${i + 1}`}
                  </span>
                  <GradeBadge score={score} color={gradeColor(score)} size="normal" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: textPrimary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: textSecondary }}>{product.brand}</div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#0a0a0a" : "#f8f9fa";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "#555";

  const { data: overallData, isLoading: overallLoading } = useQuery({
    queryKey: ["leaderboard", "overall"],
    queryFn: () => fetchProducts({ sort: "grade_desc", limit: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  const categoryResults = useQueries({
    queries: CATEGORIES.map((cat) => ({
      queryKey: ["leaderboard", "category", cat],
      queryFn: () => fetchProducts({ sort: "grade_desc", limit: 5, category: cat }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const top10 = overallData?.products ?? [];
  const anyLoading = overallLoading || categoryResults.some((r) => r.isLoading);

  const sharedProps = { isDark, textPrimary, textSecondary, cardBg, cardBorder };

  return (
    <div style={{ background: bg, minHeight: "100vh", padding: "24px 16px 80px" }}>
      <PageHero
        icon="🏆"
        title="Leaderboard"
        subtitle="The most sustainable products ranked by GreenGrade score."
      />

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {anyLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spinner />
          </div>
        )}

        {!anyLoading && (
          <>
            {/* Overall top 10 */}
            <section style={{ marginBottom: 52 }}>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.1rem, 3vw, 1.35rem)",
                  color: textPrimary,
                  marginBottom: 6,
                  letterSpacing: "-0.02em",
                }}
              >
                🌍 Global Leaders
              </h2>
              <p style={{ color: textSecondary, fontSize: "0.88rem", marginBottom: 18 }}>
                Top 10 products across all categories by GreenGrade score.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {top10.map((product, i) => (
                  <ProductRow key={product.id} rank={i + 1} product={product} {...sharedProps} />
                ))}
              </div>
            </section>

            {/* Per-category */}
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.1rem, 3vw, 1.35rem)",
                color: textPrimary,
                marginBottom: 6,
                letterSpacing: "-0.02em",
              }}
            >
              📊 Category Champions
            </h2>
            <p style={{ color: textSecondary, fontSize: "0.88rem", marginBottom: 20 }}>
              Top 5 products in each food category.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {CATEGORIES.map((cat, i) => (
                <CategoryCard
                  key={cat}
                  category={cat}
                  products={categoryResults[i]?.data?.products ?? []}
                  {...sharedProps}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
