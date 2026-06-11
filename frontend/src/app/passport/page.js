"use client";
import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import GradeBadge from "@/components/GradeBadge";
import Spinner from "@/components/Spinner";
import { fetchPassport, fetchAuditLog } from "@/services/passport";
import { scoreColor } from "@/utils/constants";

const DIMENSION_LABELS = {
  land_use_change: "Land Use Change",
  animal_feed: "Animal Feed",
  farm_operations: "Farm Operations",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

function EmissionBar({ label, value, maxValue, isDark }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const barColor =
    value > maxValue * 0.4 ? "#e74c3c" : value > maxValue * 0.2 ? "#f39c12" : "#27ae60";

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.82rem",
          marginBottom: 4,
          color: isDark ? "#b0c4b1" : "#555",
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
          {value.toFixed(3)} kg CO₂e
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: isDark ? "#1c2e22" : "#e8f0e8",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 4,
            background: barColor,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function InfoChip({ label, value, isDark }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: isDark ? "#1c2e22" : "#edf7f0",
      }}
    >
      <div style={{ fontSize: "0.7rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PassportCard({ passport, isDark }) {
  const dims = passport.emission_breakdown;
  const maxVal = Math.max(...Object.values(dims));
  const color = scoreColor(passport.greengrade_score);
  const generatedAt = new Date(passport.passport_generated_at).toLocaleString();

  function handleExport() {
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `passport-${passport.product_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        background: isDark ? "#162419" : "#fff",
        borderRadius: 16,
        padding: "24px",
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(27,67,50,0.08)",
        animation: "fadeInUp 0.4s ease both",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 12,
              background: "rgba(82,183,136,0.15)",
              color: "#52b788",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            GREENGRADE v{passport.methodology_version} · ID {passport.product_id}
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "1.3rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              margin: "0 0 4px",
            }}
          >
            {passport.product_name}
          </h2>
          <p style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#888", margin: 0 }}>
            {passport.brand} · {passport.category}
          </p>
        </div>
        <GradeBadge score={passport.greengrade_score} color={color} size="large" />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <InfoChip
          label="Total CO₂e"
          value={`${passport.total_carbon_footprint_kg_co2e.toFixed(2)} kg`}
          isDark={isDark}
        />
        <InfoChip
          label="Score Percentile"
          value={`${passport.score_percentile}th`}
          isDark={isDark}
        />
        {passport.data_confidence_label && (
          <InfoChip
            label="Data Confidence"
            value={passport.data_confidence_label}
            isDark={isDark}
          />
        )}
        <InfoChip label="Generated" value={generatedAt} isDark={isDark} />
      </div>

      {/* Emission breakdown */}
      <div
        style={{
          borderTop: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
          paddingTop: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: isDark ? "#7a9a7e" : "#888",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 12,
          }}
        >
          Emission Breakdown
        </div>
        {Object.entries(dims).map(([key, val]) => (
          <EmissionBar
            key={key}
            label={DIMENSION_LABELS[key] || key}
            value={val}
            maxValue={maxVal}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          background: "#2d6a4f",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.85rem",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1b4332")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#2d6a4f")}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export JSON
      </button>
    </div>
  );
}

function AuditLogSection({ productId, isDark }) {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function loadAudit() {
    if (auditData) {
      setExpanded((v) => !v);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLog(productId);
      setAuditData(data);
      setExpanded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: isDark ? "#162419" : "#fff",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(27,67,50,0.08)",
        animation: "fadeInUp 0.5s ease both",
      }}
    >
      <button
        onClick={loadAudit}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
          }}
        >
          Score Audit Log
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDark ? "#7a9a7e" : "#888"}
          strokeWidth="2"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {loading && (
        <div style={{ paddingTop: 16 }}>
          <Spinner message="Loading audit log..." />
        </div>
      )}

      {error && <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 12 }}>{error}</p>}

      {expanded && auditData && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 12 }}>
            {auditData.total_entries} total score change
            {auditData.total_entries !== 1 ? "s" : ""} on record.
          </p>
          {auditData.audit_entries.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#888" }}>
              No score changes recorded — this product has never been rescored since first indexing.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {auditData.audit_entries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: isDark ? "#1c2e22" : "#f8faf8",
                    border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                    fontSize: "0.82rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                      flexWrap: "wrap",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
                      {entry.old_score} → {entry.new_score}
                    </span>
                    <span style={{ color: isDark ? "#7a9a7e" : "#888" }}>
                      {new Date(entry.changed_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.change_reason && (
                    <p style={{ color: isDark ? "#b0c4b1" : "#555", margin: 0 }}>
                      {entry.change_reason}
                    </p>
                  )}
                  {entry.is_paying_client ? (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 4,
                        padding: "1px 8px",
                        borderRadius: 8,
                        background: "rgba(231,57,60,0.12)",
                        color: "#e74c3c",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      Paying client — conflict logged
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PassportPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [query, setQuery] = useState("");
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLookup(e) {
    e.preventDefault();
    const id = query.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setPassport(null);
    try {
      const data = await fetchPassport(id);
      setPassport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const bg = isDark ? "#0a0a0a" : "#f4f7f4";
  const cardBg = isDark ? "#162419" : "#fff";
  const textPrimary = isDark ? "#e8f5e9" : "#1a3a2a";
  const textSecondary = isDark ? "#b0c4b1" : "#555";

  return (
    <div style={{ background: bg, minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          background: "#0d2818",
          padding: "48px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px, 35px 35px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-block",
              padding: "3px 12px",
              borderRadius: 20,
              background: "rgba(82,183,136,0.15)",
              color: "#52b788",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            EU ESPR · SGX SCOPE 3
          </div>
          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              marginBottom: 10,
            }}
          >
            Digital Product Passport
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.95rem",
              maxWidth: 560,
              margin: "0 auto 16px",
              lineHeight: 1.6,
            }}
          >
            Machine-readable environmental footprint data per product, aligned with EU ESPR
            Regulation and SGX Scope 3 reporting requirements. Enter a product ID to generate a
            passport.
          </p>

          {/* Lookup form */}
          <form
            onSubmit={handleLookup}
            style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Product ID (e.g. 1, 42, 550)"
              aria-label="Product ID"
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "0.9rem",
                width: 220,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                background: "#52b788",
                color: "#0d2818",
                border: "none",
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: "0.9rem",
                opacity: loading || !query.trim() ? 0.6 : 1,
                transition: "background 0.2s",
              }}
            >
              {loading ? "Loading…" : "Generate Passport"}
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Error state */}
        {error && !loading && (
          <div
            style={{
              background: "rgba(231,57,60,0.1)",
              border: "1px solid rgba(231,57,60,0.25)",
              borderRadius: 12,
              padding: "16px 20px",
              color: "#e74c3c",
              fontSize: "0.9rem",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <Spinner message="Fetching passport…" />}

        {/* Passport result */}
        {passport && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PassportCard passport={passport} isDark={isDark} />
            <AuditLogSection productId={passport.product_id} isDark={isDark} />
          </div>
        )}

        {/* Empty state */}
        {!passport && !loading && !error && (
          <div
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: "48px 24px",
              textAlign: "center",
              boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(27,67,50,0.08)",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? "#2d4a35" : "#c8e6c9"}
              strokeWidth="1.5"
              style={{ marginBottom: 16 }}
            >
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="8" x2="16" y2="8" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="16" x2="12" y2="16" />
            </svg>
            <p
              style={{
                color: textPrimary,
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: 6,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              No passport loaded
            </p>
            <p
              style={{ color: textSecondary, fontSize: "0.85rem", maxWidth: 320, margin: "0 auto" }}
            >
              Enter a product ID above to generate a Digital Product Passport with full emission
              breakdown and score audit trail.
            </p>

            <div
              style={{
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                textAlign: "left",
              }}
            >
              {[
                {
                  icon: "🌱",
                  title: "7 Dimensions",
                  desc: "Land, feed, farm, processing, transport, packaging, retail",
                },
                {
                  icon: "📊",
                  title: "Score Percentile",
                  desc: "Where this product ranks across all 550 products",
                },
                {
                  icon: "🔍",
                  title: "Audit Trail",
                  desc: "Full score change history with conflict-of-interest flags",
                },
                {
                  icon: "⬇️",
                  title: "JSON Export",
                  desc: "Machine-readable for ESG reporting tools",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: isDark ? "#1c2e22" : "#edf7f0",
                    border: `1px solid ${isDark ? "#2d4a35" : "#d4edda"}`,
                  }}
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>{item.icon}</div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: textSecondary, lineHeight: 1.4 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
