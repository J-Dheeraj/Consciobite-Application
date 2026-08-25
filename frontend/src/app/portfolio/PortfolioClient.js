"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchProducts, fetchPortfolioScore } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { scoreColor } from "@/utils/constants";
import PageHero from "@/components/PageHero";
import GradeBadge from "@/components/GradeBadge";
import Spinner from "@/components/Spinner";

const MAX_PORTFOLIO = 100;

function card(isDark, extra = {}) {
  return {
    background: isDark ? "#162419" : "#fff",
    borderRadius: 14,
    padding: 20,
    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.08)",
    ...extra,
  };
}

function SummaryCard({ summary, isDark }) {
  const avgColor = scoreColor(summary.average_score);
  return (
    <div
      style={{
        ...card(isDark),
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "2.4rem",
            fontWeight: 800,
            color: avgColor,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {summary.average_score}
        </div>
        <div style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 2 }}>
          Portfolio Avg Score
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "2.4rem",
            fontWeight: 800,
            color: isDark ? "#e8f5e9" : "#1a3a2a",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {summary.product_count}
        </div>
        <div style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 2 }}>
          SKUs Scored
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#27ae60",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {summary.highest.name}
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#27ae60" }}>
          {summary.highest.score}
        </div>
        <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>Top performer</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#e74c3c",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {summary.lowest.name}
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#e74c3c" }}>
          {summary.lowest.score}
        </div>
        <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
          Needs improvement
        </div>
      </div>
    </div>
  );
}

function CategoryTable({ benchmarks, isDark }) {
  const sorted = [...benchmarks].sort((a, b) => b.avg_score - a.avg_score);
  return (
    <div style={{ ...card(isDark), marginBottom: 20, overflowX: "auto" }}>
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          marginBottom: 12,
          fontSize: "1rem",
          color: isDark ? "#e8f5e9" : "inherit",
        }}
      >
        Category Benchmarks
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
        <thead>
          <tr>
            {["Category", "SKUs", "Avg Score", "Avg Emissions (kg CO₂e)"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderBottom: "2px solid " + (isDark ? "#2d4a35" : "#eee"),
                  color: isDark ? "#95d5b2" : "#2d6a4f",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.category}
              style={{ borderBottom: "1px solid " + (isDark ? "#243a2b" : "#f5f5f5") }}
            >
              <td
                style={{
                  padding: "9px 10px",
                  color: isDark ? "#e8f5e9" : "inherit",
                  fontWeight: 500,
                }}
              >
                {row.category}
              </td>
              <td style={{ padding: "9px 10px", color: isDark ? "#c8d6c8" : "#555" }}>
                {row.count}
              </td>
              <td style={{ padding: "9px 10px" }}>
                <span style={{ fontWeight: 700, color: scoreColor(row.avg_score) }}>
                  {row.avg_score}
                </span>
              </td>
              <td style={{ padding: "9px 10px", color: isDark ? "#c8d6c8" : "#555" }}>
                {row.avg_emissions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductRow({ product, isDark }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: "1px solid " + (isDark ? "#243a2b" : "#f5f5f5"),
      }}
    >
      <GradeBadge score={product.greengrade_score} color={scoreColor(product.greengrade_score)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: isDark ? "#e8f5e9" : "inherit" }}>
          {product.product_name}
        </div>
        <div style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#888" }}>
          {product.brand} &middot; {product.category}
        </div>
      </div>
      <div
        style={{
          fontSize: "0.82rem",
          color: isDark ? "#95d5b2" : "#2d6a4f",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {product.total_carbon_footprint_kg_co2e} kg CO&#8322;e
      </div>
    </div>
  );
}

export default function PortfolioClient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", "portfolio-all"],
    queryFn: () => fetchProducts({ limit: 550 }),
    staleTime: 5 * 60 * 1000,
  });

  const scoreMutation = useMutation({
    mutationFn: (ids) => fetchPortfolioScore(ids),
  });

  const filtered = useMemo(() => {
    const all = productsData?.products ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [productsData, search]);

  const toggle = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PORTFOLIO) return prev;
      return [...prev, id];
    });
    scoreMutation.reset();
  };

  const runScore = () => {
    if (selected.length === 0) return;
    scoreMutation.mutate(selected.map(String));
  };

  const portfolioResult = scoreMutation.data;
  const sortedProducts = portfolioResult
    ? [...portfolioResult.products].sort((a, b) => b.greengrade_score - a.greengrade_score)
    : [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="&#x1F4CA;"
        title="Portfolio Scoring"
        subtitle="Select up to 100 SKUs to score your product portfolio’s environmental footprint."
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* Selector */}
        <div
          style={{
            ...card(isDark, { marginTop: -20, marginBottom: 20 }),
            animation: "fadeInUp 0.4s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                color: isDark ? "#e8f5e9" : "inherit",
              }}
            >
              {selected.length}/{MAX_PORTFOLIO} selected
            </span>
            {selected.length > 0 && (
              <button
                onClick={() => {
                  setSelected([]);
                  scoreMutation.reset();
                }}
                style={{
                  padding: "6px 14px",
                  background: "none",
                  border: "1px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  color: isDark ? "#7a9a7e" : "#666",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search by product, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products for portfolio"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "2px solid " + (isDark ? "#2d4a35" : "#e8e8e8"),
              background: isDark ? "#0f1f14" : "#fafafa",
              color: isDark ? "#e8f5e9" : "inherit",
              fontSize: "0.9rem",
              marginBottom: 10,
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              maxHeight: 280,
              overflowY: "auto",
              border: "1px solid " + (isDark ? "#2d4a35" : "#eee"),
              borderRadius: 10,
            }}
          >
            {loadingProducts ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <Spinner />
              </div>
            ) : filtered.length === 0 ? (
              <p style={{ padding: 16, color: "#888", textAlign: "center", margin: 0 }}>
                No products found.
              </p>
            ) : (
              filtered.map((p) => {
                const isSelected = selected.includes(p.id);
                const disabled = !isSelected && selected.length >= MAX_PORTFOLIO;
                return (
                  <label
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      cursor: disabled ? "not-allowed" : "pointer",
                      borderBottom: "1px solid " + (isDark ? "#243a2b" : "#f5f5f5"),
                      background: isSelected ? (isDark ? "#1c2e22" : "#edf7f0") : "transparent",
                      opacity: disabled ? 0.5 : 1,
                      transition: "background 0.15s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(p.id)}
                      disabled={disabled}
                      style={{ accentColor: "#2d6a4f", flexShrink: 0 }}
                    />
                    <GradeBadge score={p.greenGrade.score} color={p.greenGrade.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          color: isDark ? "#e8f5e9" : "inherit",
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
                        {p.brand} &middot; {p.category}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Action row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={runScore}
            disabled={selected.length === 0 || scoreMutation.isPending}
            style={{
              padding: "12px 28px",
              background:
                selected.length > 0
                  ? "linear-gradient(135deg, #2d6a4f, #40916c)"
                  : isDark
                    ? "#2d4a35"
                    : "#e8e8e8",
              color: selected.length > 0 ? "#fff" : "#aaa",
              border: "none",
              borderRadius: 12,
              cursor: selected.length > 0 ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: selected.length > 0 ? "0 2px 8px rgba(45,106,79,0.3)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {scoreMutation.isPending
              ? "Scoring..."
              : `Score ${selected.length} SKU${selected.length === 1 ? "" : "s"}`}
          </button>

          {scoreMutation.isError && (
            <span role="alert" style={{ color: "#e63946", fontSize: "0.88rem" }}>
              {scoreMutation.error?.message ?? "Scoring failed. Please try again."}
            </span>
          )}
        </div>

        {/* Results */}
        {portfolioResult && (
          <div style={{ animation: "fadeInUp 0.4s ease" }}>
            <SummaryCard summary={portfolioResult.portfolio_summary} isDark={isDark} />
            <CategoryTable benchmarks={portfolioResult.category_benchmarks} isDark={isDark} />

            <div style={card(isDark)}>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  marginBottom: 0,
                  fontSize: "1rem",
                  color: isDark ? "#e8f5e9" : "inherit",
                }}
              >
                All SKUs &mdash; ranked by score
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 12,
                  marginTop: 4,
                }}
              >
                Methodology v3.0 &middot; GreenGrade KDE + sigmoid
              </p>
              {sortedProducts.map((p) => (
                <ProductRow key={p.product_id} product={p} isDark={isDark} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
