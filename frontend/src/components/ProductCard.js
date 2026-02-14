import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import GradeBadge from "./GradeBadge";

const CATEGORY_ICONS = {
  Protein: "\uD83E\uDD69", Seafood: "\uD83D\uDC1F", "Dairy & Eggs": "\uD83E\uDD5B",
  Grains: "\uD83C\uDF3E", Fruits: "\uD83C\uDF53", Vegetables: "\uD83E\uDD66",
  Beverages: "\uD83E\uDDC3", Snacks: "\uD83C\uDF6A", Pantry: "\uD83C\uDF6F",
};

function isFavorited(id) {
  try { return JSON.parse(localStorage.getItem("consciobite_favorites") || "[]").includes(id); }
  catch { return false; }
}

function toggleFavorite(id) {
  try {
    const favs = JSON.parse(localStorage.getItem("consciobite_favorites") || "[]");
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    localStorage.setItem("consciobite_favorites", JSON.stringify(next));
    window.dispatchEvent(new Event("favorites-updated"));
    return next.includes(id);
  } catch { return false; }
}

export default function ProductCard({ product, delay = 0 }) {
  const { greenGrade } = product;
  const [fav, setFav] = useState(() => isFavorited(product.id));
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handler = () => setFav(isFavorited(product.id));
    window.addEventListener("favorites-updated", handler);
    return () => window.removeEventListener("favorites-updated", handler);
  }, [product.id]);

  const icon = CATEGORY_ICONS[product.category] || "\uD83C\uDF3F";
  const accent = greenGrade.color === "green" ? "#52b788" : greenGrade.color === "yellow" ? "#e9c46a" : "#e63946";

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 14, padding: "14px 16px",
      boxShadow: hovered ? "0 8px 24px rgba(27,67,50,0.12)" : "0 1px 4px rgba(27,67,50,0.06)",
      transition: "all 0.25s ease", transform: hovered ? "translateY(-2px)" : "translateY(0)",
      borderLeft: `3px solid ${accent}`, animation: `fadeInUp 0.4s ease ${delay}ms both`,
    }}>
      <Link to={`/product/${product.id}`} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
        <GradeBadge score={greenGrade.score} color={greenGrade.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 2 }}>{product.name}</div>
          <div style={{ fontSize: "0.82rem", color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
            <span>{product.brand}</span>
            <span style={{ color: "#ccc" }}>&middot;</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: "0.75rem" }}>{icon}</span>{product.category}
            </span>
          </div>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#888", whiteSpace: "nowrap", textAlign: "right", lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600, color: "#555" }}>{greenGrade.totalEmissions}</div>
          <div>kg CO&#8322;e</div>
        </div>
      </Link>
      <button onClick={(e) => { e.preventDefault(); setFav(toggleFavorite(product.id)); }}
        aria-label={fav ? "Remove from favorites" : "Add to favorites"} title={fav ? "Remove from favorites" : "Add to favorites"}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", padding: 4, color: fav ? "#e63946" : "#d0d0d0", flexShrink: 0, transition: "all 0.2s ease", transform: fav ? "scale(1.1)" : "scale(1)" }}>
        {fav ? "\u2665" : "\u2661"}
      </button>
    </div>
  );
}
