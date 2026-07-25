"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchProducts } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY_ICONS, scoreColor } from "@/utils/constants";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";

const CATEGORIES = [
  "All",
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

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [category, setCategory] = useState("All");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard", category],
    queryFn: () =>
      fetchProducts({
        sort: "grade_desc",
        limit: 20,
        ...(category !== "All" ? { category } : {}),
      }),
  });

  const products = data?.products ?? [];

  const bg = isDark ? "#0a0a0a" : "#f8f9fa";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "#555";
  const pillActive = { background: "#2d6a4f", color: "#fff" };
  const pillInactive = {
    background: isDark ? "rgba(255,255,255,0.08)" : "#eef7f2",
    color: isDark ? "rgba(255,255,255,0.7)" : "#2d6a4f",
  };

  return (
    <div style={{ background: bg, minHeight: "100vh", padding: "0 0 80px" }}>
      <PageHero
        icon={"🏆"}
        title="Green Leaderboard"
        subtitle="Top-ranked products by GreenGrade sustainability score."
      />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
        {/* Category pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 28,
          }}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                  ...(active ? pillActive : pillInactive),
                }}
              >
                {cat !== "All" && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Count label */}
        {!isLoading && !isError && (
          <p
            style={{
              fontSize: "0.82rem",
              color: textSecondary,
              marginBottom: 16,
            }}
          >
            {products.length === 20
              ? `Top 20 products${category !== "All" ? ` in ${category}` : ""}`
              : `${products.length} product${products.length !== 1 ? "s" : ""}${category !== "All" ? ` in ${category}` : ""}`}
          </p>
        )}

        {/* List */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spinner />
          </div>
        ) : isError ? (
          <p role="alert" style={{ color: "#e74c3c", textAlign: "center", padding: 40 }}>
            Failed to load leaderboard. Please try again.
          </p>
        ) : products.length === 0 ? (
          <p style={{ color: textSecondary, textAlign: "center", padding: 40 }}>
            No products found in this category.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 2px 12px rgba(0,0,0,0.3)"
                      : "0 2px 12px rgba(27,67,50,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: 38,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {index < 3 ? (
                      <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{MEDALS[index]}</span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: textSecondary,
                        }}
                      >
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Product info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: textPrimary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: textSecondary,
                        marginTop: 3,
                      }}
                    >
                      {product.brand}
                      {" · "}
                      {CATEGORY_ICONS[product.category] || ""} {product.category}
                    </div>
                  </div>

                  {/* Score badge */}
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: scoreColor(product.greenGrade.score),
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      flexShrink: 0,
                    }}
                  >
                    {product.greenGrade.score}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
