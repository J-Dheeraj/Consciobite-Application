"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchProduct, logCarbonPurchase } from "@/services/api";
import { scoreColor } from "@/utils/constants";
import GradeBadge from "@/components/GradeBadge";
import ProductImage from "@/components/ProductImage";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import { isFavorited, toggleFavorite } from "@/utils/favorites";

const LEGEND_ITEMS = [
  { color: "#27ae60", label: "Best" },
  { color: "#f39c12", label: "Medium" },
  { color: "#e74c3c", label: "Bad" },
];

const CATEGORY_LABELS = {
  "Land Use Change": "Land Use Change",
  "Animal Feed": "Animal Feed",
  Farm: "Farming",
  Processing: "Processing",
  Transport: "Transport",
  Packaging: "Packaging",
  Retail: "Retail",
};

const sustainabilityLabel = (score) => {
  if (score >= 8) return "This Product is Highly Sustainable";
  if (score >= 6) return "This Product is Sustainable";
  if (score >= 4) return "This Product Has Moderate Sustainability";
  if (score >= 2) return "This Product is Highly Unsustainable";
  return "This Product is Extremely Unsustainable";
};

const confidenceLabel = (conf) => {
  if (conf >= 0.8) return { text: "High Confidence", color: "#27ae60", bg: "rgba(39,174,96,0.15)" };
  if (conf >= 0.5)
    return { text: "Moderate Confidence", color: "#f39c12", bg: "rgba(243,156,18,0.15)" };
  return { text: "Low Confidence", color: "#e74c3c", bg: "rgba(231,57,60,0.15)" };
};

const tierLabel = (tier) => {
  if (tier === 1) return "Verified LCA Data";
  if (tier === 2) return "Aggregated Database";
  return "Estimated";
};

function GreenBlob() {
  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: 180, height: 200, zIndex: 0 }}
      viewBox="0 0 180 200"
      aria-hidden="true"
    >
      <circle cx="-10" cy="-10" r="140" fill="#1a7a42" opacity="0.7" />
      <ellipse cx="50" cy="60" rx="70" ry="80" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

function ConsciobiteLogo() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="16" y="34" width="32" height="22" rx="4" fill="#1a5e35" />
      <rect x="12" y="30" width="40" height="8" rx="3" fill="#2d8a4e" />
      <ellipse cx="32" cy="36" rx="14" ry="3" fill="#3d2b1f" />
      <line x1="32" y1="32" x2="32" y2="14" stroke="#52b788" strokeWidth="2.5" />
      <line x1="32" y1="22" x2="24" y2="14" stroke="#52b788" strokeWidth="2" />
      <line x1="32" y1="22" x2="40" y2="14" stroke="#52b788" strokeWidth="2" />
      <ellipse cx="24" cy="13" rx="6" ry="4" fill="#52b788" transform="rotate(-30, 24, 13)" />
      <ellipse cx="40" cy="13" rx="6" ry="4" fill="#74c69d" transform="rotate(30, 40, 13)" />
      <ellipse cx="32" cy="10" rx="5" ry="4" fill="#52b788" />
      <rect x="22" y="42" width="20" height="3" rx="1" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loggedPurchase, setLoggedPurchase] = useState(false);
  const [logError, setLogError] = useState("");
  const [showStats, setShowStats] = useState(false);

  const {
    data: product,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  const error = queryError ? "Unable to load product details." : "";
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (product) setFav(isFavorited(product.id));
    setLoggedPurchase(false);
    setLogError("");
    setShowStats(false);
  }, [product]);

  const handleLogPurchase = async () => {
    if (!product) return;
    setLogError("");
    try {
      await logCarbonPurchase(product.id, product.name, 1, product.greenGrade.totalEmissions);
      setLoggedPurchase(true);
    } catch (err) {
      setLogError(err.message || "Unable to log purchase. Please try again.");
    }
  };

  if (loading) {
    return <Spinner message="Loading product..." />;
  }

  if (error || !product) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          background: "#0d1f17",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            padding: 24,
            background: "rgba(230,57,70,0.1)",
            borderRadius: 14,
            border: "1px solid #fecaca",
            color: "#e63946",
            textAlign: "center",
          }}
        >
          <p>{error || "Product not found."}</p>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: 12,
              padding: "10px 24px",
              background: "#27ae60",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { greenGrade } = product;
  const confLabel =
    greenGrade.dataConfidence !== undefined ? confidenceLabel(greenGrade.dataConfidence) : null;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background:
          "linear-gradient(180deg, #0d1f17 0%, #0d2818 12%, #1a5e3a 30%, #4a8b6b 60%, #6d9e80 100%)",
        position: "relative",
        overflow: "hidden",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <GreenBlob />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 20px 32px",
          maxWidth: 500,
          margin: "0 auto",
        }}
      >
        {/* Logo + Brand */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <ConsciobiteLogo />
          <div
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              marginTop: 2,
            }}
          >
            Consciobite
          </div>
        </div>

        {/* Product header */}
        <div
          style={{
            width: "100%",
            background: "#14352a",
            borderRadius: 18,
            padding: "20px 20px 24px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.2rem",
                flex: 1,
              }}
            >
              {product.brand} {product.name}
            </h2>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "#b8d4c0",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                GreenGrade Legend
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {LEGEND_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      justifyContent: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: item.color,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontSize: "0.7rem", color: "#d4e8da" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              <ProductImage name={product.name} category={product.category} size={90} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => setFav(toggleFavorite(product.id))}
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                cursor: "pointer",
                fontSize: "1.4rem",
                color: fav ? "#e63946" : "rgba(255,255,255,0.4)",
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {fav ? "♥" : "♡"}
            </button>
          </div>
        </div>

        {/* GreenGrade breakdown card */}
        <div
          style={{
            width: "100%",
            background: "#0b2a1a",
            borderRadius: 18,
            padding: "20px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.15rem",
              }}
            >
              GreenGrade
            </h3>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: scoreColor(greenGrade.score),
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 2px 8px ${scoreColor(greenGrade.score)}80`,
              }}
            >
              {greenGrade.score}
            </span>
          </div>

          {confLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 16,
                padding: "8px 14px",
                borderRadius: 20,
                background: confLabel.bg,
                border: `1px solid ${confLabel.color}30`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: confLabel.color,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  color: confLabel.color,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                {confLabel.text}
              </span>
              <span style={{ color: "#b8d4c0", fontSize: "0.72rem" }}>
                {tierLabel(greenGrade.dataTier)}
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {greenGrade.breakdown.map((b) => (
              <div
                key={b.category}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 8px",
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    fontWeight: 600,
                  }}
                >
                  {CATEGORY_LABELS[b.category] || b.category}
                </span>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: scoreColor(b.categoryScore),
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 2px 6px ${scoreColor(b.categoryScore)}60`,
                  }}
                >
                  {b.categoryScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability verdict */}
        <div
          style={{
            width: "100%",
            background: "#8ee4c6",
            borderRadius: 18,
            padding: "28px 20px",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <GradeBadge score={greenGrade.score} color={greenGrade.color} size="large" />
          </div>

          <h3
            style={{
              color: "#1a3a2a",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              marginBottom: 20,
            }}
          >
            {sustainabilityLabel(greenGrade.score)}
          </h3>

          {product.purchaseLinks && product.purchaseLinks.length > 0 ? (
            <a
              href={product.purchaseLinks[0].url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "13px 0",
                borderRadius: 28,
                background: "#27ae60",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                marginBottom: 10,
                boxShadow: "0 4px 12px rgba(39,174,96,0.3)",
              }}
            >
              Click to Buy
            </a>
          ) : (
            isAuthenticated && (
              <>
                <button
                  onClick={handleLogPurchase}
                  disabled={loggedPurchase}
                  style={{
                    width: "100%",
                    padding: "13px 0",
                    borderRadius: 28,
                    border: "none",
                    background: loggedPurchase ? "#1a5e3a" : "#27ae60",
                    color: "#fff",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    cursor: loggedPurchase ? "default" : "pointer",
                    marginBottom: 10,
                    boxShadow: "0 4px 12px rgba(39,174,96,0.3)",
                  }}
                >
                  {loggedPurchase ? "\u2713 Logged to Carbon Tracker" : "Log Purchase"}
                </button>
                {logError && (
                  <p
                    role="alert"
                    aria-live="assertive"
                    style={{
                      color: "#e63946",
                      fontSize: "0.85rem",
                      marginBottom: 10,
                    }}
                  >
                    {logError}
                  </p>
                )}
              </>
            )
          )}

          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 28,
              border: "none",
              background: "#1a5e3a",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(26,94,58,0.3)",
            }}
          >
            Stats for Nerds
          </button>
        </div>

        {/* Stats for Nerds */}
        {showStats && (
          <div
            style={{
              width: "100%",
              background: "#0b2a1a",
              borderRadius: 18,
              padding: "20px",
              marginBottom: 16,
              animation: "fadeInUp 0.3s ease",
            }}
          >
            <h4
              style={{
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                marginBottom: 12,
                fontSize: "0.95rem",
              }}
            >
              Detailed Stats
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                }}
              >
                <span>Total Emissions</span>
                <span style={{ fontWeight: 600 }}>
                  {greenGrade.totalEmissions} kg CO{"₂"}e/kg
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                }}
              >
                <span>Overall Score</span>
                <span style={{ fontWeight: 600 }}>{greenGrade.score} / 10</span>
              </div>
              {greenGrade.confidence !== undefined && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>Confidence</span>
                  <span style={{ fontWeight: 600 }}>
                    {Math.round(greenGrade.confidence * 100)}%
                  </span>
                </div>
              )}
              {greenGrade.percentile !== undefined && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>Percentile</span>
                  <span style={{ fontWeight: 600 }}>
                    Top {Math.round((1 - greenGrade.percentile) * 100)}%
                  </span>
                </div>
              )}
              {greenGrade.categoryRank && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>Category Rank</span>
                  <span style={{ fontWeight: 600 }}>{greenGrade.categoryRank}</span>
                </div>
              )}
              {greenGrade.anomaly && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>Anomaly Detection</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: greenGrade.anomaly.isAnomaly ? "#e74c3c" : "#27ae60",
                    }}
                  >
                    {greenGrade.anomaly.isAnomaly ? "Flagged" : "Normal"}
                  </span>
                </div>
              )}
              {greenGrade.anomaly && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>Mahalanobis Distance</span>
                  <span style={{ fontWeight: 600 }}>{greenGrade.anomaly.distance.toFixed(2)}</span>
                </div>
              )}

              {greenGrade.dataConfidence !== undefined && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#b8d4c0",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Data Provenance
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      padding: "4px 0",
                    }}
                  >
                    <span>Data Confidence</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: confLabel.color,
                      }}
                    >
                      {Math.round(greenGrade.dataConfidence * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      padding: "4px 0",
                    }}
                  >
                    <span>Data Tier</span>
                    <span style={{ fontWeight: 600 }}>
                      Tier {greenGrade.dataTier} ({tierLabel(greenGrade.dataTier)})
                    </span>
                  </div>
                  {greenGrade.referenceProduct && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        padding: "4px 0",
                      }}
                    >
                      <span>Reference Product</span>
                      <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
                        {greenGrade.referenceProduct.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                  {greenGrade.agreementWithReference !== undefined && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        padding: "4px 0",
                      }}
                    >
                      <span>Agreement with Reference</span>
                      <span style={{ fontWeight: 600 }}>
                        {Math.round(greenGrade.agreementWithReference * 100)}%
                      </span>
                    </div>
                  )}
                  {greenGrade.sourceCount !== undefined && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        padding: "4px 0",
                      }}
                    >
                      <span>Sources</span>
                      <span style={{ fontWeight: 600 }}>
                        {greenGrade.sourceCount} source{greenGrade.sourceCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {greenGrade.lastVerified && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        padding: "4px 0",
                      }}
                    >
                      <span>Last Verified</span>
                      <span style={{ fontWeight: 600 }}>{greenGrade.lastVerified}</span>
                    </div>
                  )}
                  {greenGrade.sources && greenGrade.sources.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: "0.75rem", color: "#7a9a7e", marginBottom: 4 }}>
                        Data sourced from:
                      </div>
                      {greenGrade.sources.map((s, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: "0.75rem",
                            color: "#d4e8da",
                            padding: "2px 0",
                          }}
                        >
                          {s.name} ({s.year})
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/methodology"
                    style={{
                      display: "inline-block",
                      marginTop: 8,
                      fontSize: "0.75rem",
                      color: "#52b788",
                      textDecoration: "underline",
                    }}
                  >
                    View full methodology
                  </Link>
                </div>
              )}

              <div
                style={{
                  marginTop: 8,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#b8d4c0",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Emission Breakdown
                </div>
                {greenGrade.breakdown.map((b) => (
                  <div
                    key={b.category}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#d4e8da",
                      fontSize: "0.8rem",
                      padding: "4px 0",
                    }}
                  >
                    <span>{CATEGORY_LABELS[b.category] || b.category}</span>
                    <span>
                      {b.emission} / {b.maxReference} kg CO{"₂"}e
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Sources & Citations */}
        {product.dataSources && (
          <div
            style={{
              width: "100%",
              background: "#14352a",
              borderRadius: 18,
              padding: "20px",
              marginBottom: 16,
            }}
          >
            <h4
              style={{
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                marginBottom: 16,
                fontSize: "0.95rem",
              }}
            >
              Data Sources & Citations
            </h4>

            {product.dataSources.brand && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#b8d4c0",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Brand Information
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{ color: "#fff", fontSize: "0.88rem", fontWeight: 600, marginBottom: 4 }}
                  >
                    {product.dataSources.brand.name}
                  </div>
                  <div style={{ color: "#d4e8da", fontSize: "0.8rem", marginBottom: 4 }}>
                    {product.dataSources.brand.description}
                  </div>
                  <div style={{ color: "#d4e8da", fontSize: "0.8rem", marginBottom: 4 }}>
                    Country of Origin:{" "}
                    <span style={{ fontWeight: 600 }}>
                      {product.dataSources.brand.countryOfOrigin}
                    </span>
                  </div>
                  {product.dataSources.brand.website && (
                    <a
                      href={product.dataSources.brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#52b788",
                        fontSize: "0.78rem",
                        textDecoration: "underline",
                      }}
                    >
                      {product.dataSources.brand.website}
                    </a>
                  )}
                </div>
              </div>
            )}

            {product.dataSources.emissions && product.dataSources.emissions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#b8d4c0",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Emissions Data Sources
                </div>
                {product.dataSources.emissions.map((source, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {source.name}
                    </div>
                    <div
                      style={{
                        display: "inline-block",
                        background: "rgba(82,183,136,0.2)",
                        color: "#52b788",
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: 6,
                        marginBottom: 6,
                      }}
                    >
                      {source.type.replace(/_/g, " ")}
                    </div>
                    <div
                      style={{
                        color: "#d4e8da",
                        fontSize: "0.75rem",
                        lineHeight: 1.5,
                        marginBottom: 4,
                      }}
                    >
                      {source.citation}
                    </div>
                    {source.methodology && (
                      <div
                        style={{
                          color: "#7a9a7e",
                          fontSize: "0.72rem",
                          fontStyle: "italic",
                          marginBottom: 4,
                        }}
                      >
                        {source.methodology}
                      </div>
                    )}
                    {source.doi && (
                      <a
                        href={source.doi}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#52b788",
                          fontSize: "0.72rem",
                          textDecoration: "underline",
                        }}
                      >
                        DOI: {source.doi.replace("https://doi.org/", "")}
                      </a>
                    )}
                    {!source.doi && source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#52b788",
                          fontSize: "0.72rem",
                          textDecoration: "underline",
                        }}
                      >
                        {source.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {product.dataSources.productInfo && (
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#b8d4c0",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Methodology
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      color: "#d4e8da",
                      fontSize: "0.78rem",
                      lineHeight: 1.6,
                      marginBottom: 6,
                    }}
                  >
                    {product.dataSources.productInfo.methodology}
                  </div>
                  <div style={{ color: "#7a9a7e", fontSize: "0.72rem" }}>
                    Source: {product.dataSources.productInfo.source} | Last updated:{" "}
                    {product.dataSources.productInfo.lastUpdated}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div
          style={{
            width: "100%",
            background: "#14352a",
            borderRadius: 18,
            padding: "16px 20px",
            marginBottom: 16,
          }}
        >
          <p style={{ color: "#ffffff", fontSize: "0.88rem", lineHeight: 1.7 }}>
            {product.description}
          </p>
        </div>

        {/* Back button */}
        <div style={{ width: "100%", maxWidth: 380, padding: "0 16px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "13px 32px",
              borderRadius: 10,
              border: "none",
              background: "#27ae60",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(39,174,96,0.3)",
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
