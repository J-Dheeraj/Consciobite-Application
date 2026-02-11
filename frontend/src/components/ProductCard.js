import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import GradeBadge from "./GradeBadge";

function isFavorited(id) {
  try {
    const favs = JSON.parse(localStorage.getItem("consciobite_favorites") || "[]");
    return favs.includes(id);
  } catch {
    return false;
  }
}

function toggleFavorite(id) {
  try {
    const favs = JSON.parse(localStorage.getItem("consciobite_favorites") || "[]");
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    localStorage.setItem("consciobite_favorites", JSON.stringify(next));
    window.dispatchEvent(new Event("favorites-updated"));
    return next.includes(id);
  } catch {
    return false;
  }
}

export default function ProductCard({ product }) {
  const { greenGrade } = product;
  const [fav, setFav] = useState(() => isFavorited(product.id));

  useEffect(() => {
    const handler = () => setFav(isFavorited(product.id));
    window.addEventListener("favorites-updated", handler);
    return () => window.removeEventListener("favorites-updated", handler);
  }, [product.id]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: "#fff",
      borderRadius: 12,
      padding: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      transition: "box-shadow 0.2s",
    }}>
      <Link
        to={`/product/${product.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flex: 1,
          minWidth: 0,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <GradeBadge score={greenGrade.score} color={greenGrade.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{product.name}</div>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            {product.brand} &middot; {product.category}
          </div>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#888", whiteSpace: "nowrap" }}>
          {greenGrade.totalEmissions} kg CO2e
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          setFav(toggleFavorite(product.id));
        }}
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        title={fav ? "Remove from favorites" : "Add to favorites"}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          padding: 4,
          color: fav ? "#e63946" : "#ccc",
          flexShrink: 0,
          transition: "color 0.2s",
        }}
      >
        {fav ? "\u2665" : "\u2661"}
      </button>
    </div>
  );
}
