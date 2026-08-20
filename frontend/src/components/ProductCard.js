"use client";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import GradeBadge from "@/components/GradeBadge";
import ProductImage from "@/components/ProductImage";
import { isFavorited, toggleFavorite } from "@/utils/favorites";
import { CATEGORY_ICONS } from "@/utils/constants";
import styles from "./ProductCard.module.css";

function ProductCard({ product, delay = 0 }) {
  const { greenGrade } = product;
  const [fav, setFav] = useState(() => isFavorited(product.id));

  useEffect(() => {
    const handler = () => setFav(isFavorited(product.id));
    window.addEventListener("favorites-updated", handler);
    return () => window.removeEventListener("favorites-updated", handler);
  }, [product.id]);

  const icon = CATEGORY_ICONS[product.category] || "🌿";
  const accent =
    greenGrade.color === "green"
      ? "#52b788"
      : greenGrade.color === "yellow"
        ? "#e9c46a"
        : "#e63946";

  return (
    <article
      className={styles.card}
      style={{ "--accent-color": accent, animationDelay: `${delay}ms` }}
    >
      <Link href={`/product/${product.id}/`} className={styles.link}>
        <ProductImage name={product.name} category={product.category} size={44} />
        <GradeBadge score={greenGrade.score} color={greenGrade.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.name}>{product.name}</div>
          <div className={styles.meta}>
            <span>{product.brand}</span>
            <span>{"·"}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: "0.72rem" }}>{icon}</span>
              {product.category}
            </span>
          </div>
        </div>
        <div className={styles.emissions}>
          <div className={styles.emissionsValue}>{greenGrade.totalEmissions}</div>
          <div>kg CO{"₂"}e</div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          setFav(toggleFavorite(product.id));
        }}
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        title={fav ? "Remove from favorites" : "Add to favorites"}
        className={`${styles.favButton} ${fav ? styles.favActive : styles.favInactive}`}
      >
        {fav ? "♥" : "♡"}
      </button>
    </article>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    greenGrade: PropTypes.shape({
      score: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
      totalEmissions: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  delay: PropTypes.number,
};

export default React.memo(ProductCard);
