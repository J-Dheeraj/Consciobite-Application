import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProduct } from "../services/api";
import ProductCard from "../components/ProductCard";

function getFavoriteIds() {
  try {
    return JSON.parse(localStorage.getItem("consciobite_favorites") || "[]");
  } catch {
    return [];
  }
}

export default function Favorites() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getFavoriteIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id) => fetchProduct(id).catch(() => null)))
      .then((results) => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  const clearAll = () => {
    localStorage.setItem("consciobite_favorites", "[]");
    setProducts([]);
    window.dispatchEvent(new Event("favorites-updated"));
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 24, textAlign: "center", color: "#888" }}>
        Loading favorites...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1>My Favorites</h1>
        {products.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              padding: "6px 14px",
              background: "none",
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "#666",
            }}
          >
            Clear All
          </button>
        )}
      </div>
      <p style={{ color: "#666", marginBottom: 20, fontSize: "0.9rem" }}>
        Products you've saved for quick access.
      </p>

      {products.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 40,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}>
          <p style={{ color: "#888", marginBottom: 16 }}>You haven't saved any favorites yet.</p>
          <Link
            to="/"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#2d6a4f",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
