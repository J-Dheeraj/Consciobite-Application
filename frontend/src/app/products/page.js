"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/services/api";
import { scoreColor } from "@/utils/constants";
import { useTheme } from "@/context/ThemeContext";

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

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "grade_desc", label: "GreenGrade: High to Low" },
  { value: "grade_asc", label: "GreenGrade: Low to High" },
  { value: "emissions_asc", label: "Emissions: Low to High" },
  { value: "emissions_desc", label: "Emissions: High to Low" },
];

const SCORE_FILTERS = [
  { label: "All Scores", value: null },
  { label: "Green 7+", value: 7 },
  { label: "Good 5+", value: 5 },
  { label: "Fair 3+", value: 3 },
];

export default function Products() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("");
  const [minScore, setMinScore] = useState(null);
  const [page, setPage] = useState(1);

  // Debounce search input 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, sort, minScore]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["products", { search: debouncedSearch, category, sort, minScore, page }],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch || undefined,
        category: category !== "All" ? category : undefined,
        sort: sort || undefined,
        minScore: minScore ?? undefined,
        page,
        limit: 24,
      }),
    placeholderData: (prev) => prev,
  });

  const products = data?.products || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalCount = data?.pagination?.totalCount;

  const bg = isDark ? "#0a0a0a" : "#f8f9fa";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "#555";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "#888";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  return (
    <div style={{ background: bg, minHeight: "100vh", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              color: textPrimary,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
              letterSpacing: "-0.03em",
              marginBottom: 6,
            }}
          >
            Browse Products
          </h1>
          <p style={{ color: textSecondary, fontSize: "0.95rem" }}>
            {totalCount != null
              ? `${totalCount} product${totalCount !== 1 ? "s" : ""} match your filters`
              : "Explore GreenGrade scores across 500+ food products"}
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
            style={{
              flex: "1 1 240px",
              padding: "11px 16px",
              borderRadius: 10,
              border: `1.5px solid ${inputBorder}`,
              background: inputBg,
              color: textPrimary,
              fontSize: "0.9rem",
              outline: "none",
              fontWeight: 500,
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            style={{
              padding: "11px 16px",
              borderRadius: 10,
              border: `1.5px solid ${inputBorder}`,
              background: inputBg,
              color: textPrimary,
              fontSize: "0.9rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
            style={{
              padding: "11px 16px",
              borderRadius: 10,
              border: `1.5px solid ${inputBorder}`,
              background: inputBg,
              color: textPrimary,
              fontSize: "0.9rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Score filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {SCORE_FILTERS.map((sf) => {
            const active = minScore === sf.value;
            return (
              <button
                key={String(sf.value)}
                onClick={() => setMinScore(sf.value)}
                aria-pressed={active}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: active
                    ? "1.5px solid #2d6a4f"
                    : `1.5px solid ${inputBorder}`,
                  background: active
                    ? isDark
                      ? "#1c3a2a"
                      : "#edf7f0"
                    : inputBg,
                  color: active ? (isDark ? "#95d5b2" : "#2d6a4f") : textSecondary,
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {sf.label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              background: isDark ? "rgba(231,76,60,0.15)" : "#fef2f2",
              color: "#e74c3c",
              marginBottom: 20,
              fontSize: "0.9rem",
            }}
          >
            {error.message || "Failed to load products."}
          </div>
        )}

        {/* Loading (initial only — isFetching keeps stale content visible) */}
        {isLoading && (
          <div style={{ padding: 48, textAlign: "center", color: textMuted }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid #d8f3dc",
                borderTopColor: "#2d6a4f",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            Loading products...
          </div>
        )}

        {/* No results */}
        {!isLoading && !error && products.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: textMuted, fontSize: "0.95rem" }}>
            No products found. Try adjusting your search or filters.
          </div>
        )}

        {/* Product Grid — keep visible while fetching next page */}
        {!isLoading && products.length > 0 && (
          <div
            style={{
              opacity: isFetching ? 0.6 : 1,
              transition: "opacity 0.2s",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 14,
                  padding: "20px 18px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "#2d6a4f";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = cardBorder;
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: textPrimary,
                        marginBottom: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: textMuted }}>{p.brand}</div>
                  </div>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: scoreColor(p.greenGrade?.score || 0),
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    {p.greenGrade?.score ?? "—"}
                  </div>
                </div>

                {p.greenGrade?.emissions && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: isDark ? "rgba(45,106,79,0.15)" : "#edf7f0",
                        color: "#2d6a4f",
                        fontWeight: 500,
                      }}
                    >
                      {p.greenGrade.emissions.total?.toFixed(1)} kg CO₂e
                    </span>
                    {p.category && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: isDark ? "rgba(255,255,255,0.06)" : "#f5f5f5",
                          color: textSecondary,
                          fontWeight: 500,
                        }}
                      >
                        {p.category}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 32,
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: `1.5px solid ${inputBorder}`,
                background: inputBg,
                color: page <= 1 ? textMuted : textPrimary,
                cursor: page <= 1 ? "default" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <span style={{ color: textSecondary, fontSize: "0.9rem" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: `1.5px solid ${inputBorder}`,
                background: inputBg,
                color: page >= totalPages ? textMuted : textPrimary,
                cursor: page >= totalPages ? "default" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
