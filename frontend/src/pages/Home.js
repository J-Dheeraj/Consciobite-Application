import React, { useEffect, useState, useCallback } from "react";
import { fetchProducts } from "../services/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { key: "All", icon: "\uD83C\uDF0D" },
  { key: "Protein", icon: "\uD83E\uDD69" },
  { key: "Seafood", icon: "\uD83D\uDC1F" },
  { key: "Dairy & Eggs", icon: "\uD83E\uDD5B" },
  { key: "Grains", icon: "\uD83C\uDF3E" },
  { key: "Fruits", icon: "\uD83C\uDF53" },
  { key: "Vegetables", icon: "\uD83E\uDD66" },
  { key: "Beverages", icon: "\uD83E\uDDC3" },
  { key: "Snacks", icon: "\uD83C\uDF6A" },
  { key: "Pantry", icon: "\uD83C\uDF6F" },
];

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
      .then((data) => { setProducts(data.products); setPagination(data.pagination); })
      .catch(() => setError("Unable to load products. Please try again later."))
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(1); }, [search, category, sort]);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%)",
        padding: "40px 24px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "60px 60px, 40px 40px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8, animation: "float 3s ease-in-out infinite" }}>
            {"\uD83C\uDF3F"}
          </div>
          <h1 style={{ color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.8rem", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Discover Sustainable Food
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", maxWidth: 420, margin: "0 auto 24px" }}>
            Browse 550+ products and their GreenGrade sustainability scores across Singapore.
          </p>
          {/* Search bar */}
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", opacity: 0.5 }}>{"\uD83D\uDD0D"}</span>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
              style={{
                width: "100%", padding: "14px 16px 14px 42px", borderRadius: 14,
                border: "2px solid rgba(255,255,255,0.2)", fontSize: "0.95rem",
                background: "rgba(255,255,255,0.12)", color: "#fff",
                backdropFilter: "blur(10px)", outline: "none",
                transition: "all 0.2s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "20px 0 16px", WebkitOverflowScrolling: "touch" }}>
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)} style={{
              padding: "8px 16px", borderRadius: 24, border: category === c.key ? "2px solid #2d6a4f" : "2px solid #e0e0e0",
              background: category === c.key ? "#2d6a4f" : "#fff",
              color: category === c.key ? "#fff" : "#555",
              cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", whiteSpace: "nowrap",
              transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6,
              boxShadow: category === c.key ? "0 2px 8px rgba(45,106,79,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <span style={{ fontSize: "0.9rem" }}>{c.icon}</span>{c.key}
            </button>
          ))}
        </div>

        {/* Sort & count row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          {pagination && !loading && (
            <p style={{ color: "#888", fontSize: "0.85rem" }}>
              Showing {products.length} of {pagination.totalCount} products
            </p>
          )}
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products"
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e0e0e0", fontSize: "0.85rem", color: "#555", background: "#fff" }}>
            <option value="grade_desc">Best Grade First</option>
            <option value="grade_asc">Lowest Grade First</option>
            <option value="emissions_asc">Lowest Emissions First</option>
            <option value="emissions_desc">Highest Emissions First</option>
          </select>
        </div>

        {error && (
          <div style={{ color: "#e63946", marginBottom: 12, padding: 20, background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", animation: "fadeInUp 0.3s ease" }}>
            <p style={{ marginBottom: 8 }}>{error}</p>
            <button onClick={loadProducts} style={{ padding: "8px 18px", background: "#e63946", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "#888" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #d8f3dc", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: "0.9rem" }}>Loading products...</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {products.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "#888", background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(27,67,50,0.06)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>{"\uD83D\uDD0D"}</div>
                  No products found. Try adjusting your search or filters.
                </div>
              )}
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} delay={Math.min(i * 30, 300)} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 28 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev} aria-label="Previous page"
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: pagination.hasPrev ? "#2d6a4f" : "#e8e8e8", color: pagination.hasPrev ? "#fff" : "#aaa", cursor: pagination.hasPrev ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s ease" }}>
                  Previous
                </button>
                <span style={{ fontSize: "0.88rem", color: "#666", fontWeight: 500 }}>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext} aria-label="Next page"
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: pagination.hasNext ? "#2d6a4f" : "#e8e8e8", color: pagination.hasNext ? "#fff" : "#aaa", cursor: pagination.hasNext ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s ease" }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
