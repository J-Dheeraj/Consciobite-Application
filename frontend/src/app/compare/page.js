"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchProducts, compareProducts } from "@/services/api";
import GradeBadge from "@/components/GradeBadge";
import GradeBreakdown from "@/components/GradeBreakdown";
import { useTheme } from "@/context/ThemeContext";
import PageHero from "@/components/PageHero";

export default function Compare() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");

  const {
    data,
    isError,
    error: loadError,
  } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ limit: 550 }),
    staleTime: 5 * 60_000,
  });

  const allProducts = data?.products || [];

  const {
    data: compared,
    mutate: runComparison,
    isPending: comparing,
    error: compareError,
    reset: resetComparison,
  } = useMutation({
    mutationFn: (ids) => compareProducts(ids).then((d) => d.products),
  });

  const toggleProduct = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
    resetComparison();
  };

  const filtered = searchFilter
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : allProducts;

  const errorMsg =
    (isError && (loadError?.message || "Unable to load products.")) ||
    (compareError && (compareError?.message || "Unable to compare products."));

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"⚖️"}
        title="Compare Products"
        subtitle="Select 2-5 products to compare their environmental impact."
      />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Selector */}
        <div
          style={{
            marginTop: -20,
            background: isDark ? "#162419" : "#fff",
            borderRadius: 14,
            padding: 20,
            boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
            marginBottom: 20,
            animation: "fadeInUp 0.4s ease",
          }}
        >
          <input
            type="text"
            placeholder="Search to find products..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            aria-label="Search products to compare"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "2px solid " + (isDark ? "#2d4a35" : "#e8e8e8"),
              fontSize: "0.9rem",
              marginBottom: 12,
              transition: "border-color 0.2s",
            }}
          />
          <div
            style={{
              maxHeight: 240,
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
                  padding: "10px 14px",
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
                  disabled={!selected.includes(p.id) && selected.length >= 5}
                  style={{ accentColor: "#2d6a4f" }}
                />
                <GradeBadge score={p.greenGrade.score} color={p.greenGrade.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: isDark ? "#e8f5e9" : "inherit",
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#666" }}>
                    {p.brand} {"·"} {p.greenGrade.totalEmissions} kg CO{"₂"}e
                  </div>
                </div>
              </label>
            ))}
            {filtered.length === 0 && allProducts.length > 0 && (
              <p style={{ padding: 16, color: "#888", textAlign: "center" }}>No products found.</p>
            )}
            {allProducts.length === 0 && !isError && (
              <p style={{ padding: 16, color: "#888", textAlign: "center" }}>Loading products...</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => runComparison(selected)}
            disabled={selected.length < 2 || comparing}
            style={{
              padding: "12px 28px",
              background:
                selected.length >= 2
                  ? "linear-gradient(135deg, #2d6a4f, #40916c)"
                  : isDark
                    ? "#2d4a35"
                    : "#e8e8e8",
              color: selected.length >= 2 ? "#fff" : "#aaa",
              border: "none",
              borderRadius: 12,
              cursor: selected.length >= 2 ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: selected.length >= 2 ? "0 2px 8px rgba(45,106,79,0.3)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {comparing ? "Comparing..." : `Compare ${selected.length} Products`}
          </button>
          {selected.length > 0 && (
            <button
              onClick={() => {
                setSelected([]);
                resetComparison();
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

        {errorMsg && (
          <p role="alert" aria-live="assertive" style={{ color: "#e63946", marginBottom: 12 }}>
            {errorMsg}
          </p>
        )}

        {compared && (
          <div style={{ animation: "fadeInUp 0.4s ease" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {compared.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: isDark ? "#162419" : "#fff",
                    borderRadius: 14,
                    padding: 18,
                    textAlign: "center",
                    boxShadow: isDark
                      ? "0 2px 8px rgba(0,0,0,0.15)"
                      : "0 2px 8px rgba(27,67,50,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <GradeBadge
                      score={p.greenGrade.score}
                      color={p.greenGrade.color}
                      size="large"
                    />
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      marginBottom: 2,
                      color: isDark ? "#e8f5e9" : "inherit",
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#666" }}>
                    {p.brand}
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: isDark ? "#7a9a7e" : "#888",
                      marginTop: 6,
                    }}
                  >
                    {p.greenGrade.totalEmissions} kg CO{"₂"}e
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
              Emissions Breakdown
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {compared.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: isDark ? "#162419" : "#fff",
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: isDark
                      ? "0 2px 8px rgba(0,0,0,0.15)"
                      : "0 2px 8px rgba(27,67,50,0.06)",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.88rem",
                      marginBottom: 10,
                      fontFamily: "'Outfit', sans-serif",
                      color: isDark ? "#e8f5e9" : "inherit",
                    }}
                  >
                    {p.name}
                  </h4>
                  <GradeBreakdown
                    breakdown={p.greenGrade.breakdown}
                    totalEmissions={p.greenGrade.totalEmissions}
                    totalScore={p.greenGrade.score}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
