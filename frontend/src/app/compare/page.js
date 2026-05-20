"use client";
import React, { useEffect, useState } from "react";
import { fetchProducts, compareProducts } from "@/services/api";
import GradeBadge from "@/components/GradeBadge";
import GradeBreakdown from "@/components/GradeBreakdown";
import { useTheme } from "@/context/ThemeContext";
import PageHero from "@/components/PageHero";

export default function Compare() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]);
  const [compared, setCompared] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    if (!searchFilter.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await fetchProducts({ search: searchFilter.trim(), limit: 50 });
        setSearchResults(data.products);
      } catch {
        // ignore transient search errors
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  const toggleProduct = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
    setCompared(null);
  };

  const runComparison = async () => {
    if (selected.length < 2) return;
    setError("");
    setLoading(true);
    try {
      const data = await compareProducts(selected);
      setCompared(data.products);
    } catch (err) {
      setError(err.message || "Unable to compare products.");
    } finally {
      setLoading(false);
    }
  };

  const displayProducts = searchFilter.trim() ? searchResults : [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"\u2696\uFE0F"}
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
            placeholder="Search all 550 products by name or brand..."
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
            {displayProducts.map((p) => (
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
                    {p.brand} {"\u00B7"} {p.greenGrade.totalEmissions} kg CO{"\u2082"}e
                  </div>
                </div>
              </label>
            ))}
            {!searchFilter.trim() && (
              <p
                style={{
                  padding: 16,
                  color: isDark ? "#7a9a7e" : "#aaa",
                  textAlign: "center",
                  fontSize: "0.85rem",
                }}
              >
                Type to search across all 550 products
              </p>
            )}
            {searchFilter.trim() && searching && (
              <p style={{ padding: 16, color: "#888", textAlign: "center", fontSize: "0.85rem" }}>
                Searching...
              </p>
            )}
            {searchFilter.trim() && !searching && displayProducts.length === 0 && (
              <p style={{ padding: 16, color: "#888", textAlign: "center" }}>No products found.</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={runComparison}
            disabled={selected.length < 2 || loading}
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
            {loading ? "Comparing..." : `Compare ${selected.length} Products`}
          </button>
          {selected.length > 0 && (
            <button
              onClick={() => {
                setSelected([]);
                setCompared(null);
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

        {error && (
          <p role="alert" aria-live="assertive" style={{ color: "#e63946", marginBottom: 12 }}>
            {error}
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
                    {p.greenGrade.totalEmissions} kg CO{"\u2082"}e
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
