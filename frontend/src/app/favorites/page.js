"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProduct } from "@/services/api";
import { fetchFavoriteIds, clearServerFavorites } from "@/services/favorites";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";
import { useTheme } from "@/context/ThemeContext";
import { getFavoriteIds, clearFavorites } from "@/utils/favorites";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";
import { pageContainer, card, primaryButton, heading } from "@/utils/pageStyles";

function useServerFavorites(isAuthenticated) {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavoriteIds,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export default function Favorites() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: serverIds, isLoading: serverLoading } = useServerFavorites(isAuthenticated);

  const [localProducts, setLocalProducts] = useState([]);
  const [localLoading, setLocalLoading] = useState(!isAuthenticated);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmHeadingId = "confirm-dialog-title";
  const cancelBtnRef = useRef(null);

  // Sync server favorites into localStorage when they load
  useEffect(() => {
    if (!isAuthenticated || !serverIds) return;
    if (typeof window === "undefined") return;
    localStorage.setItem("consciobite_favorites", JSON.stringify(serverIds));
    window.dispatchEvent(new Event("favorites-updated"));
  }, [isAuthenticated, serverIds]);

  // Load product details from server IDs or localStorage IDs
  const [serverProducts, setServerProducts] = useState([]);
  const [serverProductsLoading, setServerProductsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !serverIds) return;
    if (serverIds.length === 0) {
      setServerProducts([]);
      return;
    }
    setServerProductsLoading(true);
    Promise.all(serverIds.map((id) => fetchProduct(id).catch(() => null)))
      .then((results) => setServerProducts(results.filter(Boolean)))
      .finally(() => setServerProductsLoading(false));
  }, [isAuthenticated, serverIds]);

  // Load from localStorage for unauthenticated users
  useEffect(() => {
    if (isAuthenticated) return;
    const ids = getFavoriteIds();
    if (ids.length === 0) {
      setLocalLoading(false);
      return;
    }
    Promise.all(ids.map((id) => fetchProduct(id).catch(() => null)))
      .then((results) => setLocalProducts(results.filter(Boolean)))
      .finally(() => setLocalLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!showConfirm) return;
    cancelBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") setShowConfirm(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showConfirm]);

  async function handleClearAll() {
    if (isAuthenticated) {
      try {
        await clearServerFavorites();
        queryClient.setQueryData(["favorites"], []);
      } catch {
        // Best-effort — localStorage still cleared below
      }
    }
    clearFavorites();
    setLocalProducts([]);
    setServerProducts([]);
    setShowConfirm(false);
  }

  const isLoading = isAuthenticated ? serverLoading || serverProductsLoading : localLoading;

  const products = isAuthenticated ? serverProducts : localProducts;

  if (isLoading) {
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
            : "Products you’ve saved for quick access."
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
              {isAuthenticated && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: "0.75rem",
                    color: isDark ? "#52b788" : "#2d6a4f",
                  }}
                >
                  {"✓ synced"}
                </span>
              )}
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
                This will remove all {products.length} saved products.
                {isAuthenticated && " Your saved list will be cleared from all devices."} This
                action cannot be undone.
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
