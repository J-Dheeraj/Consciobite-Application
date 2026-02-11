import React, { useEffect, useState, useCallback } from "react";
import { fetchProducts } from "../services/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES = ["All", "Protein", "Seafood", "Dairy & Eggs", "Grains", "Fruits", "Vegetables", "Beverages", "Snacks", "Pantry"];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("grade_desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(() => {
    setError("");
    setLoading(true);
    fetchProducts({
      search: search || undefined,
      category: category === "All" ? undefined : category,
      sort,
      page,
      limit: 20,
    })
      .then((data) => {
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .catch(() => setError("Unable to load products. Please try again later."))
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Discover Sustainable Food</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: "0.9rem" }}>
        Browse products and their GreenGrade sustainability scores.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "0.9rem",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="grade_desc">Best Grade First</option>
          <option value="grade_asc">Lowest Grade First</option>
          <option value="emissions_asc">Lowest Emissions First</option>
          <option value="emissions_desc">Highest Emissions First</option>
        </select>
      </div>

      {error && (
        <div style={{
          color: "#e63946",
          marginBottom: 12,
          padding: 16,
          background: "#fef2f2",
          borderRadius: 8,
          border: "1px solid #fecaca",
        }}>
          <p style={{ marginBottom: 8 }}>{error}</p>
          <button
            onClick={loadProducts}
            style={{
              padding: "6px 14px",
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
          <div style={{
            width: 32,
            height: 32,
            border: "3px solid #e0e0e0",
            borderTopColor: "#2d6a4f",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }} />
          Loading products...
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {!loading && !error && (
        <>
          {pagination && (
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: 12 }}>
              Showing {products.length} of {pagination.totalCount} products
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {products.length === 0 && <p style={{ color: "#888" }}>No products found.</p>}
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 24,
              flexWrap: "wrap",
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                aria-label="Previous page"
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: pagination.hasPrev ? "#fff" : "#f0f0f0",
                  cursor: pagination.hasPrev ? "pointer" : "not-allowed",
                  color: pagination.hasPrev ? "#1a1a2e" : "#aaa",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "0.9rem", color: "#666" }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                aria-label="Next page"
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: pagination.hasNext ? "#fff" : "#f0f0f0",
                  cursor: pagination.hasNext ? "pointer" : "not-allowed",
                  color: pagination.hasNext ? "#1a1a2e" : "#aaa",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
