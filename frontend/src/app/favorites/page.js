"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProduct, listFavorites, removeFavorite } from "@/services/api";
import ProductCard from "@/components/ProductCard";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { getFavoriteIds, clearFavorites } from "@/utils/favorites";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";
import { pageContainer, card, primaryButton, heading } from "@/utils/pageStyles";

function useFavoriteIds(isAuthenticated) {
  const { data: serverData } = useQuery({
    queryKey: ["favorites"],
    queryFn: listFavorites,
    enabled: isAuthenticated,
    select: (d) => d.productIds,
    staleTime: 30_000,
  });

  if (isAuthenticated) return serverData ?? [];
  return getFavoriteIds();
}

export default function Favorites() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmHeadingId = "confirm-dialog-title";
  const cancelBtnRef = useRef(null);

  const favoriteIds = useFavoriteIds(isAuthenticated);

  useEffect(() => {
    if (!showConfirm) return;
    cancelBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") setShowConfirm(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showConfirm]);

  useEffect(() => {
    if (isAuthenticated && favoriteIds === undefined) return;
    if (favoriteIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(favoriteIds.map((id) => fetchProduct(id).catch(() => null)))
      .then((results) => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [favoriteIds, isAuthenticated]);

  const handleClearAll = async () => {
    clearFavorites();
    if (isAuthenticated) {
      await Promise.allSettled(favoriteIds.map((id) => removeFavorite(id)));
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
    setProducts([]);
    setShowConfirm(false);
  };

  if (loading) {
    return <Spinner message="Loading favorites..." />;
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"♥"}
        title="My Favorites"
        subtitle={
          isAuthenticated
            ? "Your saved products, synced across devices."
            : "Products you've saved for quick access."
        }
      />

      <div style={pageContainer(700)}>
        {products.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0 8px",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#888" }}>
              {products.length} saved product{products.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "1px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.82rem",
                color: isDark ? "#7a9a7e" : "#888",
                transition: "all 0.2s ease",
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Confirmation dialog */}
        {showConfirm && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={confirmHeadingId}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.2s ease",
              padding: 20,
            }}
            onClick={() => setShowConfirm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                ...card(isDark, { radius: 16, padding: 28 }),
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                maxWidth: 360,
                width: "100%",
                animation: "fadeInUp 0.25s ease",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{"⚠️"}</div>
              <h3
                id={confirmHeadingId}
                style={{
                  ...heading(),
                  marginBottom: 8,
                  color: isDark ? "#e8f5e9" : "#1a1a2e",
                }}
              >
                Clear all favorites?
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                This will remove all {products.length} saved products. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  ref={cancelBtnRef}
                  onClick={() => setShowConfirm(false)}
                  style={{
                    padding: "10px 24px",
                    background: isDark ? "#1c2e22" : "#f0f0f0",
                    color: isDark ? "#b0c4b1" : "#555",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  style={{
                    padding: "10px 24px",
                    background: "#e63946",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div
            style={{
              ...card(isDark),
              textAlign: "center",
              padding: 48,
              marginTop: -20,
              animation: "fadeInUp 0.4s ease",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>{"♡"}</div>
            <p
              style={{ color: isDark ? "#7a9a7e" : "#888", marginBottom: 20, fontSize: "0.95rem" }}
            >
              You haven&apos;t saved any favorites yet.
            </p>
            <Link
              href="/"
              style={{ ...primaryButton(), display: "inline-block", textDecoration: "none" }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={i * 40} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
