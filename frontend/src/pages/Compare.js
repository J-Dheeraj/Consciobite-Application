import React, { useEffect, useState } from "react";
import { fetchProducts, compareProducts } from "../services/api";
import GradeBadge from "../components/GradeBadge";
import GradeBreakdown from "../components/GradeBreakdown";

export default function Compare() {
  const [allProducts, setAllProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [compared, setCompared] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    fetchProducts({ limit: 100 })
      .then((data) => setAllProducts(data.products))
      .catch(() => {});
  }, []);

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

  const filtered = searchFilter
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : allProducts;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Compare Products</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: "0.9rem" }}>
        Select 2-5 products to compare their environmental impact side by side.
      </p>

      {/* Product selector */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search to find products..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          aria-label="Search products to compare"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "0.9rem",
            marginBottom: 12,
          }}
        />

        <div style={{
          maxHeight: 240,
          overflowY: "auto",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          background: "#fff",
        }}>
          {filtered.map((p) => (
            <label
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
                background: selected.includes(p.id) ? "#e8f5e9" : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggleProduct(p.id)}
                disabled={!selected.includes(p.id) && selected.length >= 5}
              />
              <GradeBadge score={p.greenGrade.score} color={p.greenGrade.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  {p.brand} &middot; {p.greenGrade.totalEmissions} kg CO2e
                </div>
              </div>
            </label>
          ))}
          {filtered.length === 0 && (
            <p style={{ padding: 16, color: "#888", textAlign: "center" }}>No products found.</p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={runComparison}
          disabled={selected.length < 2 || loading}
          style={{
            padding: "10px 24px",
            background: selected.length >= 2 ? "#2d6a4f" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: selected.length >= 2 ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          {loading ? "Comparing..." : `Compare ${selected.length} Products`}
        </button>
        {selected.length > 0 && (
          <button
            onClick={() => { setSelected([]); setCompared(null); }}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "1px solid #ccc",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Clear Selection
          </button>
        )}
      </div>

      {error && <p style={{ color: "#e63946", marginBottom: 12 }}>{error}</p>}

      {/* Comparison results */}
      {compared && (
        <div>
          {/* Score overview */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`,
            gap: 12,
            marginBottom: 24,
          }}>
            {compared.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <GradeBadge score={p.greenGrade.score} color={p.greenGrade.color} size="large" />
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>{p.brand}</div>
                <div style={{ fontSize: "0.85rem", color: "#888", marginTop: 6 }}>
                  {p.greenGrade.totalEmissions} kg CO2e
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown comparison */}
          <h3 style={{ marginBottom: 12 }}>Emissions Breakdown</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`,
            gap: 12,
          }}>
            {compared.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <h4 style={{ fontSize: "0.85rem", marginBottom: 8 }}>{p.name}</h4>
                <GradeBreakdown
                  breakdown={p.greenGrade.breakdown}
                  totalEmissions={p.greenGrade.totalEmissions}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
