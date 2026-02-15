import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProduct } from "../services/api";
import ProductCard from "../components/ProductCard";

function getFavoriteIds() {
  try { return JSON.parse(localStorage.getItem("consciobite_favorites") || "[]"); }
  catch { return []; }
}

export default function Favorites() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getFavoriteIds();
    if (ids.length === 0) { setLoading(false); return; }
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
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 48, textAlign: "center", color: "#888" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #d8f3dc", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        Loading favorites...
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)", padding: "36px 24px 44px", textAlign: "center" }}>
        <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>{"\u2665"}</div>
        <h1 style={{ color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.6rem", marginBottom: 6 }}>My Favorites</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>Products you've saved for quick access.</p>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 40px" }}>
        {products.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 0 8px" }}>
            <button onClick={clearAll} style={{ padding: "8px 16px", background: "none", border: "1px solid #e0e0e0", borderRadius: 8, cursor: "pointer", fontSize: "0.82rem", color: "#888", transition: "all 0.2s ease" }}>
              Clear All
            </button>
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, marginTop: -20, background: "#fff", borderRadius: 14, boxShadow: "0 4px 12px rgba(27,67,50,0.08)", animation: "fadeInUp 0.4s ease" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>{"\u2661"}</div>
            <p style={{ color: "#888", marginBottom: 20, fontSize: "0.95rem" }}>You haven't saved any favorites yet.</p>
            <Link to="/" style={{ display: "inline-block", padding: "12px 24px", background: "linear-gradient(135deg, #2d6a4f, #40916c)", color: "#fff", borderRadius: 12, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 8px rgba(45,106,79,0.3)" }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: products.length > 0 ? 0 : -20 }}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={i * 40} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
