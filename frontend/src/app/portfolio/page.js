"use client";
import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchProducts, fetchPortfolioScore } from "@/services/api";
import { scoreColor } from "@/utils/constants";
import { useTheme } from "@/context/ThemeContext";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import Link from "next/link";

const MAX_SELECTION = 100;

function ScorePill({ score }) {
  const color = scoreColor(score);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        background: `${color}22`,
        color,
        fontWeight: 700,
        fontSize: "0.82rem",
        minWidth: 36,
        textAlign: "center",
      }}
    >
      {score}
    </span>
  );
}

function SummaryCard({ summary, isDark }) {
  const avgColor = scoreColor(summary.average_score);
  const cardBg = isDark ? "#162419" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "#777";

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(27,67,50,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#52b788",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Portfolio Summary
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Portfolio Avg", value: summary.average_score, accent: avgColor },
          { label: "Products Scored", value: summary.product_count, accent: "#52b788" },
          { label: "Best Score", value: summary.highest.score, accent: "#27ae60", sub: summary.highest.name },
          { label: "Lowest Score", value: summary.lowest.score, accent: "#e74c3c", sub: summary.lowest.name },
        ].map(({ label, value, accent, sub }) => (
          <div
            key={label}
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "#f8f9fa",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: textMuted, marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: "1.3rem", color: accent }}>{value}</div>
            {sub && (
              <div
                style={{
                  fontSize: "0.72rem",
                  color: textMuted,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 140,
                }}
              >
                {sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBenchmarks({ benchmarks, isDark }) {
  const sorted = [...benchmarks].sort((a, b) => b.avg_score - a.avg_score);
  const maxScore = 10;
  const cardBg = isDark ? "#162419" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "#777";

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(27,67,50,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#52b788",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Category Benchmarks
      </div>

      {sorted.map((b) => {
        const color = scoreColor(b.avg_score);
        const pct = (b.avg_score / maxScore) * 100;
        return (
          <div key={b.category} style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 5,
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: isDark ? "#c8d6c8" : "#333", fontWeight: 500 }}>
                {b.category}{" "}
                <span style={{ color: textMuted, fontWeight: 400, fontSize: "0.78rem" }}>
                  ({b.count} {b.count === 1 ? "product" : "products"})
                </span>
              </span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: textMuted, fontSize: "0.78rem" }}>
                  {b.avg_emissions} kg CO₂e avg
                </span>
                <span style={{ fontWeight: 700, color, fontSize: "0.88rem" }}>
                  {b.avg_score}
                </span>
              </div>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: isDark ? "#1c2e22" : "#f0f0f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: color,
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductResultList({ products, isDark }) {
  const cardBg = isDark ? "#162419" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "#777";
  const sorted = [...products].sort((a, b) => b.greengrade_score - a.greengrade_score);

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: 24,
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(27,67,50,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#52b788",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        All Products ({products.length})
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr>
              {["Product", "Brand", "Category", "Score", "CO₂e (kg/kg)", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#eee"}`,
                    color: textMuted,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.product_id}
                style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5"}` }}
              >
                <td style={{ padding: "10px 10px", color: isDark ? "#ededed" : "#1a1a2e", fontWeight: 500 }}>
                  {p.product_name}
                </td>
                <td style={{ padding: "10px 10px", color: textMuted }}>{p.brand}</td>
                <td style={{ padding: "10px 10px", color: textMuted }}>{p.category}</td>
                <td style={{ padding: "10px 10px" }}>
                  <ScorePill score={p.greengrade_score} />
                </td>
                <td style={{ padding: "10px 10px", color: textMuted }}>
                  {p.total_carbon_footprint_kg_co2e.toFixed(3)}
                </td>
                <td style={{ padding: "10px 10px" }}>
                  <Link
                    href={`/passport/${p.product_id}`}
                    style={{
                      color: "#52b788",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Passport →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [allProducts, setAllProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [loadError, setLoadError] = useState("");

  const bg = isDark ? "#0a0a0a" : "#f8f9fa";
  const cardBg = isDark ? "#162419" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "#777";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  useEffect(() => {
    fetchProducts({ limit: 550 })
      .then((data) => setAllProducts(data.products || []))
      .catch((err) => setLoadError(err.message || "Unable to load products."));
  }, []);

  const mutation = useMutation({
    mutationFn: (ids) => fetchPortfolioScore(ids),
  });

  const toggleProduct = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
    mutation.reset();
  };

  const filtered = searchFilter
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.category.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : allProducts;

  const handleScore = () => {
    if (selected.length < 1) return;
    mutation.mutate(selected.map(String));
  };

  const handleClear = () => {
    setSelected([]);
    mutation.reset();
  };

  return (
    <div style={{ background: bg, minHeight: "100vh", padding: "24px 16px 80px" }}>
      <PageHero
        icon="📊"
        title="Portfolio Scorer"
        subtitle="Score up to 100 SKUs at once and get category benchmarks for your product range."
      />

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Selection panel */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(27,67,50,0.08)",
            animation: "fadeInUp 0.4s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontWeight: 700, color: textPrimary, fontSize: "0.95rem" }}>
              Select Products{" "}
              <span style={{ color: textMuted, fontWeight: 400 }}>
                ({selected.length}/{MAX_SELECTION} selected)
              </span>
            </span>
            {selected.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  padding: "5px 14px",
                  borderRadius: 8,
                  border: `1px solid ${inputBorder}`,
                  background: "transparent",
                  color: textMuted,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search by name, brand, or category…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            aria-label="Search products for portfolio"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: `2px solid ${inputBorder}`,
              background: inputBg,
              color: textPrimary,
              fontSize: "0.9rem",
              marginBottom: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {loadError && (
            <div style={{ color: "#e74c3c", marginBottom: 10, fontSize: "0.85rem" }}>{loadError}</div>
          )}

          <div
            style={{
              maxHeight: 280,
              overflowY: "auto",
              border: `1px solid ${border}`,
              borderRadius: 10,
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: 16, color: textMuted, textAlign: "center", fontSize: "0.85rem" }}>
                No products match your search.
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected = selected.includes(p.id);
                return (
                  <label
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f5f5f5"}`,
                      background: isSelected
                        ? isDark
                          ? "#1c2e22"
                          : "#edf7f0"
                        : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(p.id)}
                      disabled={!isSelected && selected.length >= MAX_SELECTION}
                      style={{ accentColor: "#52b788", width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: textPrimary,
                          fontSize: "0.88rem",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </span>
                      <span style={{ color: textMuted, fontSize: "0.76rem" }}>
                        {p.brand} · {p.category}
                      </span>
                    </span>
                    <ScorePill score={p.greenGrade?.score ?? "—"} />
                  </label>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={handleScore}
              disabled={selected.length < 1 || mutation.isPending}
              style={{
                padding: "11px 28px",
                borderRadius: 10,
                border: "none",
                background: selected.length < 1 ? (isDark ? "#2d4a35" : "#ccc") : "#2d6a4f",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: selected.length < 1 ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {mutation.isPending ? "Scoring…" : `Score Portfolio (${selected.length})`}
            </button>
          </div>
        </div>

        {/* Results */}
        {mutation.isPending && <Spinner message="Scoring your portfolio…" />}

        {mutation.isError && (
          <div
            style={{
              background: "rgba(231,57,60,0.1)",
              border: "1px solid rgba(231,57,60,0.3)",
              borderRadius: 12,
              padding: "16px 20px",
              color: "#e74c3c",
              marginBottom: 20,
              fontSize: "0.88rem",
            }}
          >
            {mutation.error?.message || "Unable to score portfolio. Please try again."}
          </div>
        )}

        {mutation.isSuccess && mutation.data && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <SummaryCard summary={mutation.data.portfolio_summary} isDark={isDark} />
            {mutation.data.category_benchmarks?.length > 0 && (
              <CategoryBenchmarks benchmarks={mutation.data.category_benchmarks} isDark={isDark} />
            )}
            <ProductResultList products={mutation.data.products} isDark={isDark} />
          </div>
        )}
      </div>
    </div>
  );
}
