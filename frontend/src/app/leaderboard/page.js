"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchLeaderboard } from "@/services/api";
import { scoreColor, CATEGORY_ICONS } from "@/utils/constants";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

const TIER_COLORS = { green: "#27ae60", amber: "#f39c12", red: "#e74c3c" };
const TIER_LABELS = { green: "Green", amber: "Amber", red: "Red" };

function TierBadge({ tier }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: "0.72rem",
        fontWeight: 700,
        background: TIER_COLORS[tier] + "22",
        color: TIER_COLORS[tier],
        border: `1px solid ${TIER_COLORS[tier]}55`,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

function ScoreBadge({ score }) {
  return (
    <span
      style={{
        display: "inline-block",
        minWidth: 40,
        padding: "3px 8px",
        borderRadius: 8,
        fontSize: "0.9rem",
        fontWeight: 800,
        background: scoreColor(score) + "22",
        color: scoreColor(score),
        textAlign: "center",
      }}
    >
      {score.toFixed(1)}
    </span>
  );
}

function RankRow({ rank, product, isDark }) {
  const isTop3 = rank <= 3;
  return (
    <Link
      href={`/product/${product.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        borderRadius: 10,
        background: isDark
          ? isTop3
            ? "rgba(116,198,157,0.07)"
            : "rgba(255,255,255,0.03)"
          : isTop3
            ? "rgba(39,174,96,0.06)"
            : "rgba(0,0,0,0.02)",
        border: `1px solid ${isDark ? (isTop3 ? "#2d4a35" : "#2a2a2a") : isTop3 ? "#c8e6c9" : "#f0f0f0"}`,
        marginBottom: 8,
        textDecoration: "none",
        color: "inherit",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "0.85rem",
          background:
            rank === 1
              ? "#FFD700"
              : rank === 2
                ? "#C0C0C0"
                : rank === 3
                  ? "#CD7F32"
                  : isDark
                    ? "#2a2a2a"
                    : "#e8e8e8",
          color: rank <= 3 ? "#1a1a1a" : isDark ? "#aaa" : "#555",
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {product.name}
        </div>
        <div style={{ fontSize: "0.78rem", color: isDark ? "#78a08a" : "#6b7280", marginTop: 2 }}>
          {product.brand}
          {product.category && (
            <>
              {" · "}
              {product.category}
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <TierBadge tier={product.tier} />
        <ScoreBadge score={product.score} />
      </div>
    </Link>
  );
}

function TierBar({ tierCounts, isDark }) {
  const { green, amber, red, total } = tierCounts;
  const pct = (n) => ((n / total) * 100).toFixed(1);
  return (
    <div style={{ ...card(isDark, { radius: 14 }), padding: "20px 24px", marginBottom: 24 }}>
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          marginBottom: 16,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        Tier Distribution — {total} products
      </h3>
      <div
        style={{
          display: "flex",
          borderRadius: 8,
          overflow: "hidden",
          height: 20,
          marginBottom: 12,
        }}
      >
        <div
          title={`Green: ${green} (${pct(green)}%)`}
          style={{ width: `${pct(green)}%`, background: "#27ae60" }}
        />
        <div
          title={`Amber: ${amber} (${pct(amber)}%)`}
          style={{ width: `${pct(amber)}%`, background: "#f39c12" }}
        />
        <div
          title={`Red: ${red} (${pct(red)}%)`}
          style={{ width: `${pct(red)}%`, background: "#e74c3c" }}
        />
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[
          { label: "Green ≥7.0", count: green, color: "#27ae60" },
          { label: "Amber 4–7", count: amber, color: "#f39c12" },
          { label: "Red <4.0", count: red, color: "#e74c3c" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.82rem", color: isDark ? "#aaa" : "#555" }}>
              {label}: <strong style={{ color: isDark ? "#ddd" : "#333" }}>{count}</strong> (
              {pct(count)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 5 * 60 * 1000,
  });

  const categories = data?.categories || [];
  const activeCategory = selectedCategory || categories[0] || null;
  const categoryProducts = activeCategory ? data?.byCategory?.[activeCategory] || [] : [];

  return (
    <div style={pageContainer(isDark)}>
      <PageHero
        title="GreenGrade Leaderboard"
        subtitle="Top-scoring products across all categories"
        isDark={isDark}
      />

      {isLoading && (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spinner />
        </div>
      )}

      {isError && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#e74c3c",
            fontSize: "0.95rem",
          }}
        >
          Could not load leaderboard. Please try again.
        </div>
      )}

      {data && (
        <>
          <TierBar tierCounts={data.tierCounts} isDark={isDark} />

          {/* Overall Top 10 */}
          <div style={{ ...card(isDark, { radius: 14 }), padding: "20px 24px", marginBottom: 24 }}>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                marginBottom: 18,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              Overall Top 10
            </h2>
            {data.overall.map((product, i) => (
              <RankRow key={product.id} rank={i + 1} product={product} isDark={isDark} />
            ))}
          </div>

          {/* By Category */}
          {categories.length > 0 && (
            <div style={{ ...card(isDark, { radius: 14 }), padding: "20px 24px" }}>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  marginBottom: 16,
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                }}
              >
                Top 5 by Category
              </h2>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {categories.map((cat) => {
                  const isActive = cat === activeCategory;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: `1px solid ${isActive ? "#27ae60" : isDark ? "#2d4a35" : "#d1d5db"}`,
                        background: isActive
                          ? "#27ae60"
                          : isDark
                            ? "rgba(255,255,255,0.04)"
                            : "#fff",
                        color: isActive ? "#fff" : isDark ? "#aaa" : "#374151",
                        fontWeight: isActive ? 700 : 400,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}
                      {cat}
                    </button>
                  );
                })}
              </div>

              {categoryProducts.map((product, i) => (
                <RankRow key={product.id} rank={i + 1} product={product} isDark={isDark} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
