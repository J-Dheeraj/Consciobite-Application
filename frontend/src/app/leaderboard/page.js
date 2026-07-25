"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY_ICONS, scoreColor } from "@/utils/constants";
import GradeBadge from "@/components/GradeBadge";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, errorAlert } from "@/utils/pageStyles";

const MEDALS = ["🥇", "🥈", "🥉"];

function RankLabel({ rank }) {
  if (rank < 3) {
    return (
      <span style={{ fontSize: "1.1rem", minWidth: 28, textAlign: "center" }}>{MEDALS[rank]}</span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        fontSize: "0.9rem",
        color: "#7a9a7e",
        minWidth: 28,
        textAlign: "center",
      }}
    >
      #{rank + 1}
    </span>
  );
}

export default function Leaderboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchProducts({ sort: "grade_desc", limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(() => data?.products || [], [data]);
  const top10 = products.slice(0, 10);

  const byCategory = useMemo(() => {
    const groups = {};
    for (const p of products) {
      if (!groups[p.category]) groups[p.category] = [];
      if (groups[p.category].length < 5) groups[p.category].push(p);
    }
    return Object.entries(groups).sort(([, a], [, b]) => {
      const avg = (arr) =>
        arr.slice(0, 3).reduce((s, p) => s + p.greenGrade.score, 0) / Math.min(arr.length, 3);
      return avg(b) - avg(a);
    });
  }, [products]);

  if (isLoading) return <Spinner message="Loading leaderboard..." />;

  const rowBg = (score) => {
    if (score >= 7) return isDark ? "rgba(45,106,79,0.15)" : "#edf7f0";
    if (score >= 4) return isDark ? "rgba(58,44,13,0.3)" : "#fef9e7";
    return isDark ? "rgba(42,13,15,0.3)" : "#fef2f2";
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🏆"
        title="Eco Leaderboard"
        subtitle="The most eco-friendly products in our catalog, ranked by GreenGrade score."
      />

      <div style={pageContainer(780)}>
        {error && (
          <div role="alert" style={{ ...errorAlert(isDark), marginBottom: 16 }}>
            Failed to load leaderboard. Please try again.
          </div>
        )}

        {/* Overall Top 10 */}
        <section aria-labelledby="top10-heading" style={{ marginBottom: 36 }}>
          <h2
            id="top10-heading"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.2rem",
              marginBottom: 4,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            Overall Top 10
          </h2>
          <p style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 16 }}>
            Highest-scoring products across all categories
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top10.map((p, i) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    ...card(isDark),
                    border: `1px solid ${isDark ? "#2d4a35" : "#f0f4f0"}`,
                  }}
                >
                  <RankLabel rank={i} />
                  <GradeBadge score={p.greenGrade.score} color={p.greenGrade.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: isDark ? "#e8f5e9" : "#1a3a2a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
                      {p.brand} &middot; {CATEGORY_ICONS[p.category] || "🌿"} {p.category}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                      CO&#8322;e
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: scoreColor(p.greenGrade.score),
                        fontSize: "0.9rem",
                      }}
                    >
                      {p.greenGrade.totalEmissions} kg
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Best by Category */}
        <section aria-labelledby="by-cat-heading">
          <h2
            id="by-cat-heading"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.2rem",
              marginBottom: 4,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            Best by Category
          </h2>
          <p style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 20 }}>
            Top picks from each food group
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {byCategory.map(([category, items]) => (
              <div key={category} style={{ ...card(isDark), padding: 20 }}>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    marginBottom: 14,
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                  }}
                >
                  {CATEGORY_ICONS[category] || "🌿"} {category}
                </h3>
                <ol
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {items.map((p, i) => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            background: rowBg(p.greenGrade.score),
                            borderRadius: 9,
                            fontSize: "0.87rem",
                          }}
                        >
                          <span
                            style={{
                              minWidth: 22,
                              textAlign: "center",
                              fontSize: i === 0 ? "0.95rem" : "0.78rem",
                              fontWeight: i > 0 ? 700 : undefined,
                              color: i > 0 ? (isDark ? "#7a9a7e" : "#aaa") : undefined,
                            }}
                          >
                            {i === 0 ? "🥇" : `#${i + 1}`}
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: scoreColor(p.greenGrade.score),
                              minWidth: 40,
                              fontSize: "0.88rem",
                            }}
                          >
                            {p.greenGrade.score}/10
                          </span>
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: isDark ? "#e8f5e9" : "#1a3a2a",
                            }}
                          >
                            {p.name}
                          </span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: isDark ? "#7a9a7e" : "#aaa",
                              flexShrink: 0,
                            }}
                          >
                            {p.greenGrade.totalEmissions} kg
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
