"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchProducts, fetchPortfolioScore } from "@/services/api";
import GradeBadge from "@/components/GradeBadge";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { useTheme } from "@/context/ThemeContext";

function scoreToColor(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

function gradeTextColor(score, isDark) {
  if (score >= 7) return isDark ? "#95d5b2" : "#2d6a4f";
  if (score >= 4) return "#b45309";
  return "#e63946";
}

const cardStyle = (isDark, extra = {}) => ({
  background: isDark ? "#14352a" : "#fff",
  borderRadius: 14,
  padding: 24,
  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.06)",
  ...extra,
});

const headingStyle = (isDark) => ({
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 700,
  marginBottom: 2,
  color: isDark ? "#e8f5e9" : "inherit",
});

const subtextStyle = (isDark) => ({
  fontSize: "0.82rem",
  color: isDark ? "#7a9a7e" : "#888",
  marginBottom: 16,
});

function SummaryCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.6rem",
          color,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "inherit",
          opacity: 0.7,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      {sub && <div style={{ fontSize: "0.72rem", opacity: 0.55 }}>{sub}</div>}
    </div>
  );
}

export default function Portfolio() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-portfolio-catalog"],
    queryFn: () => fetchProducts({ limit: 550 }),
    staleTime: 5 * 60 * 1000,
  });

  const scoreMutation = useMutation({
    mutationFn: (ids) => fetchPortfolioScore(ids.map(String)),
  });

  const allProducts = productsData?.products || [];

  const filtered = search
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      )
    : allProducts;

  const toggleProduct = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 100) return prev;
      return [...prev, id];
    });
  };

  const handleScore = () => {
    if (selected.length < 1) return;
    scoreMutation.mutate(selected);
  };

  const result = scoreMutation.data;
  const summary = result?.portfolio_summary;
  const benchmarks = result?.category_benchmarks || [];
  const passports = result?.products || [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📋"
        title="Portfolio Scoring"
        subtitle="Score your full product portfolio against the GreenGrade methodology."
      />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Product Selector */}
        <div
          style={{
            marginTop: -20,
            ...cardStyle(isDark, { marginBottom: 20, animation: "fadeInUp 0.4s ease" }),
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div>
              <h3 style={headingStyle(isDark)}>Select SKUs</h3>
              <p style={{ ...subtextStyle(isDark), marginBottom: 0 }}>
                Choose up to 100 products for portfolio analysis.
              </p>
            </div>
            {selected.length > 0 && (
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: isDark ? "#95d5b2" : "#2d6a4f",
                  background: isDark ? "#1c3a2a" : "#edf7f0",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                {selected.length} / 100
              </span>
            )}
          </div>

          <input
            type="text"
            placeholder="Search by name, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products for portfolio selection"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "2px solid " + (isDark ? "#2d4a35" : "#e8e8e8"),
              background: isDark ? "#1a2d22" : "#fff",
              color: isDark ? "#e8f5e9" : "inherit",
              fontSize: "0.9rem",
              marginBottom: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {productsLoading ? (
            <Spinner message="Loading catalog..." />
          ) : (
            <div
              style={{
                maxHeight: 280,
                overflowY: "auto",
                border: "1px solid " + (isDark ? "#2d4a35" : "#eee"),
                borderRadius: 10,
              }}
            >
              {filtered.map((p) => (
                <label
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid " + (isDark ? "#243a2b" : "#f5f5f5"),
                    background: selected.includes(p.id)
                      ? isDark
                        ? "#1c2e22"
                        : "#edf7f0"
                      : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    disabled={!selected.includes(p.id) && selected.length >= 100}
                    style={{ accentColor: "#2d6a4f", flexShrink: 0 }}
                  />
                  <GradeBadge
                    score={p.greenGrade.score}
                    color={scoreToColor(p.greenGrade.score)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        color: isDark ? "#e8f5e9" : "inherit",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#666" }}>
                      {p.brand} &middot; {p.category}
                    </div>
                  </div>
                  <span
                    style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888", flexShrink: 0 }}
                  >
                    {p.greenGrade.totalEmissions} kg
                  </span>
                </label>
              ))}
              {filtered.length === 0 && (
                <p
                  style={{ padding: 16, color: "#888", textAlign: "center", fontSize: "0.85rem" }}
                >
                  No products match your search.
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleScore}
              disabled={selected.length < 1 || scoreMutation.isPending}
              style={{
                padding: "12px 28px",
                background:
                  selected.length >= 1
                    ? "linear-gradient(135deg, #2d6a4f, #40916c)"
                    : isDark
                      ? "#2d4a35"
                      : "#e8e8e8",
                color: selected.length >= 1 ? "#fff" : "#aaa",
                border: "none",
                borderRadius: 12,
                cursor: selected.length >= 1 ? "pointer" : "not-allowed",
                fontWeight: 600,
                fontSize: "0.9rem",
                boxShadow: selected.length >= 1 ? "0 2px 8px rgba(45,106,79,0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {scoreMutation.isPending
                ? "Scoring..."
                : `Score ${selected.length} SKU${selected.length !== 1 ? "s" : ""}`}
            </button>
            {selected.length > 0 && (
              <button
                onClick={() => {
                  setSelected([]);
                  scoreMutation.reset();
                }}
                style={{
                  padding: "10px 16px",
                  background: "none",
                  border: "1px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: isDark ? "#7a9a7e" : "#666",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {scoreMutation.isError && (
          <p
            role="alert"
            aria-live="assertive"
            style={{ color: "#e63946", marginBottom: 12, fontSize: "0.9rem" }}
          >
            {scoreMutation.error?.message || "Unable to score portfolio."}
          </p>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeInUp 0.4s ease" }}>
            {/* Summary Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                {
                  icon: "📦",
                  label: "Products Scored",
                  value: summary.product_count,
                  color: isDark ? "#95d5b2" : "#2d6a4f",
                },
                {
                  icon: "⭐",
                  label: "Portfolio Avg",
                  value: summary.average_score,
                  sub: "out of 10",
                  color: gradeTextColor(summary.average_score, isDark),
                },
                {
                  icon: "🏆",
                  label: "Best SKU",
                  value: summary.highest.score,
                  sub:
                    summary.highest.name.length > 22
                      ? summary.highest.name.slice(0, 20) + "…"
                      : summary.highest.name,
                  color: gradeTextColor(summary.highest.score, isDark),
                },
                {
                  icon: "⚠️",
                  label: "Needs Attention",
                  value: summary.lowest.score,
                  sub:
                    summary.lowest.name.length > 22
                      ? summary.lowest.name.slice(0, 20) + "…"
                      : summary.lowest.name,
                  color: gradeTextColor(summary.lowest.score, isDark),
                },
              ].map(({ icon, label, value, sub, color }) => (
                <div key={label} style={cardStyle(isDark, { textAlign: "center" })}>
                  <SummaryCard
                    icon={icon}
                    label={label}
                    value={value}
                    sub={sub}
                    color={color}
                  />
                </div>
              ))}
            </div>

            {/* Category Benchmarks */}
            {benchmarks.length > 0 && (
              <div style={{ ...cardStyle(isDark, { marginBottom: 20 }) }}>
                <h3 style={headingStyle(isDark)}>Category Benchmarks</h3>
                <p style={subtextStyle(isDark)}>
                  Sorted by average score — highest performing categories first.
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "2px solid " + (isDark ? "#2d4a35" : "#edf7f0"),
                        }}
                      >
                        {["Category", "SKUs", "Avg Score", "Avg CO₂e", "Score"].map(
                          (h, i) => (
                            <th
                              key={h}
                              style={{
                                padding: "10px 8px",
                                color: isDark ? "#95d5b2" : "#2d6a4f",
                                fontWeight: 700,
                                textAlign: i > 0 ? "right" : "left",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {[...benchmarks]
                        .sort((a, b) => b.avg_score - a.avg_score)
                        .map((cat) => (
                          <tr
                            key={cat.category}
                            style={{
                              borderBottom: "1px solid " + (isDark ? "#2d4a35" : "#f5f5f5"),
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 8px",
                                fontWeight: 500,
                                color: isDark ? "#e8f5e9" : "inherit",
                              }}
                            >
                              {cat.category}
                            </td>
                            <td
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                color: isDark ? "#b0c4b1" : "#666",
                              }}
                            >
                              {cat.count}
                            </td>
                            <td
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: 700,
                                color: gradeTextColor(cat.avg_score, isDark),
                              }}
                            >
                              {cat.avg_score}
                            </td>
                            <td
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                color: isDark ? "#b0c4b1" : "#666",
                              }}
                            >
                              {cat.avg_emissions} kg
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "right", minWidth: 100 }}>
                              <div
                                style={{
                                  background: isDark ? "#1e3a28" : "#e8f5e9",
                                  borderRadius: 6,
                                  height: 8,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${(cat.avg_score / 10) * 100}%`,
                                    height: "100%",
                                    background:
                                      cat.avg_score >= 7
                                        ? "#52b788"
                                        : cat.avg_score >= 4
                                          ? "#e9c46a"
                                          : "#e63946",
                                    borderRadius: 6,
                                    transition: "width 0.6s ease",
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div style={cardStyle(isDark)}>
              <h3 style={headingStyle(isDark)}>
                All Scored Products ({passports.length})
              </h3>
              <p style={subtextStyle(isDark)}>
                Sorted by score — click any product to view its full Digital Product Passport.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
                  gap: 12,
                }}
              >
                {[...passports]
                  .sort((a, b) => b.greengrade_score - a.greengrade_score)
                  .map((p) => (
                    <Link
                      key={p.product_id}
                      href={`/passport/${p.product_id}/`}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <div
                        style={{
                          background: isDark ? "#1a2d22" : "#f5fbf7",
                          borderRadius: 10,
                          padding: "14px 12px",
                          textAlign: "center",
                          border: "1px solid " + (isDark ? "#2d4a35" : "#e8f3ea"),
                          transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = isDark
                            ? "0 4px 14px rgba(0,0,0,0.35)"
                            : "0 4px 14px rgba(27,67,50,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "";
                          e.currentTarget.style.boxShadow = "";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                          <GradeBadge
                            score={p.greengrade_score}
                            color={scoreToColor(p.greengrade_score)}
                            size="large"
                          />
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            color: isDark ? "#e8f5e9" : "#1b3a25",
                            marginBottom: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={p.product_name}
                        >
                          {p.product_name}
                        </div>
                        <div
                          style={{ fontSize: "0.74rem", color: isDark ? "#7a9a7e" : "#666", marginBottom: 4 }}
                        >
                          {p.brand}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: isDark ? "#95d5b2" : "#40916c",
                            fontWeight: 600,
                          }}
                        >
                          {p.total_carbon_footprint_kg_co2e} kg CO&#x2082;e
                        </div>
                        {p.data_confidence_label && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: "0.68rem",
                              color: isDark ? "#7a9a7e" : "#888",
                              fontStyle: "italic",
                            }}
                          >
                            {p.data_confidence_label}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
