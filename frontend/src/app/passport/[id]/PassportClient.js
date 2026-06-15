"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchPassport, fetchAuditTrail } from "@/services/passport";
import { useTheme } from "@/context/ThemeContext";
import { scoreColor } from "@/utils/constants";
import GradeBadge from "@/components/GradeBadge";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";
import { pageContainer, card, primaryButton } from "@/utils/pageStyles";

const EMISSION_LABELS = {
  land_use_change: "Land Use Change",
  animal_feed: "Animal Feed",
  farm_operations: "Farm Operations",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

const TIER_INFO = {
  1: { label: "Verified LCA Data", color: "#27ae60", bg: "rgba(39,174,96,0.12)" },
  2: { label: "Aggregated Database", color: "#f39c12", bg: "rgba(243,156,18,0.12)" },
  3: { label: "Estimated", color: "#e74c3c", bg: "rgba(231,76,60,0.12)" },
};

function RowSeparator() {
  return <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", margin: "0" }} />;
}

function EmissionBar({ value, max, isDark }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      style={{
        height: 6,
        borderRadius: 4,
        background: isDark ? "#1e2e25" : "#eaf3ec",
        overflow: "hidden",
        flexShrink: 0,
        width: 80,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 4,
          background: "linear-gradient(90deg, #40916c, #27ae60)",
        }}
      />
    </div>
  );
}

export default function PassportClient() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [showAudit, setShowAudit] = useState(false);

  const {
    data: passport,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["passport", id],
    queryFn: () => fetchPassport(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => fetchAuditTrail(id),
    enabled: !!id && showAudit,
    staleTime: 60 * 1000,
  });

  function downloadJSON() {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `passport-${passport.product_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const bg = isDark ? "#0d1f16" : "#f0f7f2";
  const text = isDark ? "#e8f5e9" : "#1b4332";
  const muted = isDark ? "#7aad8a" : "#52796f";

  if (isLoading) {
    return (
      <div style={{ background: bg, minHeight: "100vh", paddingTop: 80 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: bg, minHeight: "100vh", paddingTop: 80 }}>
        <div style={{ ...pageContainer(700), color: text }}>
          <div
            style={{
              ...card(isDark),
              padding: 32,
              textAlign: "center",
              borderLeft: "4px solid #e74c3c",
            }}
          >
            <p style={{ color: "#e74c3c", fontWeight: 600, marginBottom: 8 }}>
              Could not load passport
            </p>
            <p style={{ color: muted, marginBottom: 24 }}>{error.message}</p>
            <Link
              href="/products"
              style={{ color: "#40916c", textDecoration: "none", fontWeight: 600 }}
            >
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!passport) return null;

  const tierInfo = TIER_INFO[passport.data_confidence_tier] || TIER_INFO[3];
  const emissionValues = Object.values(passport.emission_breakdown);
  const maxEmission = Math.max(...emissionValues);
  const generatedAt = new Date(passport.passport_generated_at).toLocaleString();

  return (
    <div style={{ background: bg, minHeight: "100vh", color: text }}>
      <PageHero
        title="Digital Product Passport"
        subtitle={`${passport.product_name} · ${passport.brand}`}
      />

      <div style={{ ...pageContainer(700), paddingTop: 32 }}>
        {/* Back link */}
        <Link
          href={`/product/${passport.product_id}`}
          style={{ color: "#40916c", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}
        >
          ← Back to product
        </Link>

        {/* Score hero card */}
        <div
          style={{
            ...card(isDark),
            marginTop: 20,
            padding: "28px 28px 24px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <GradeBadge score={passport.greengrade_score} size="lg" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.8rem", color: muted, fontWeight: 600, marginBottom: 4 }}>
              GREENGRADE SCORE
            </div>
            <div
              style={{
                fontSize: "2.4rem",
                fontWeight: 800,
                color: scoreColor(passport.greengrade_score),
                lineHeight: 1,
              }}
            >
              {passport.greengrade_score.toFixed(1)}
              <span style={{ fontSize: "1rem", color: muted, fontWeight: 500 }}> / 10</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: muted, marginTop: 6 }}>
              Top {(100 - passport.score_percentile).toFixed(0)}% of all products
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: muted, fontWeight: 600, marginBottom: 4 }}>
              TOTAL CARBON
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: text }}>
              {passport.total_carbon_footprint_kg_co2e.toFixed(2)}
            </div>
            <div style={{ fontSize: "0.75rem", color: muted }}>kg CO₂e</div>
          </div>
        </div>

        {/* Data confidence */}
        <div
          style={{
            ...card(isDark),
            marginTop: 16,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: tierInfo.color,
              flexShrink: 0,
            }}
          />
          <div>
            <span style={{ fontWeight: 600, color: tierInfo.color, fontSize: "0.9rem" }}>
              {tierInfo.label}
            </span>
            <span style={{ color: muted, fontSize: "0.85rem", marginLeft: 8 }}>
              — Tier {passport.data_confidence_tier} data confidence
            </span>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
              background: tierInfo.bg,
              color: tierInfo.color,
              padding: "3px 10px",
              borderRadius: 20,
              fontWeight: 600,
            }}
          >
            {passport.data_confidence_label || tierInfo.label}
          </span>
        </div>

        {/* Emission breakdown */}
        <div style={{ ...card(isDark), marginTop: 16, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px 12px",
              borderBottom: `1px solid ${isDark ? "#1e3a2a" : "#e8f5e9"}`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1rem", color: text }}>Emission Breakdown</div>
            <div style={{ fontSize: "0.8rem", color: muted, marginTop: 2 }}>
              7 supply chain categories · kg CO₂e per kg of product
            </div>
          </div>
          {Object.entries(passport.emission_breakdown).map(([key, value], idx, arr) => (
            <React.Fragment key={key}>
              <div
                style={{
                  padding: "13px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, fontSize: "0.9rem", color: text }}>
                  {EMISSION_LABELS[key] || key}
                </div>
                <EmissionBar value={value} max={maxEmission} isDark={isDark} />
                <div
                  style={{
                    width: 72,
                    textAlign: "right",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: text,
                  }}
                >
                  {value.toFixed(3)}
                </div>
              </div>
              {idx < arr.length - 1 && <RowSeparator />}
            </React.Fragment>
          ))}
          <div
            style={{
              padding: "12px 20px",
              borderTop: `2px solid ${isDark ? "#1e3a2a" : "#d4edda"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: text }}>Total</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: scoreColor(passport.greengrade_score),
              }}
            >
              {passport.total_carbon_footprint_kg_co2e.toFixed(3)} kg CO₂e
            </span>
          </div>
        </div>

        {/* Passport metadata */}
        <div style={{ ...card(isDark), marginTop: 16, padding: "16px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: text, marginBottom: 12 }}>
            Passport Details
          </div>
          {[
            ["Product ID", passport.product_id],
            ["Category", passport.category],
            ["Methodology Version", `v${passport.methodology_version}`],
            ["Generated At", generatedAt],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: `1px solid ${isDark ? "#1e3a2a" : "#f0f7f2"}`,
                fontSize: "0.875rem",
              }}
            >
              <span style={{ color: muted }}>{label}</span>
              <span style={{ color: text, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <button
            onClick={downloadJSON}
            style={{
              ...primaryButton(),
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.9rem",
            }}
          >
            Download JSON
          </button>
          <button
            onClick={() => setShowAudit((v) => !v)}
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: isDark ? "#74c69d" : "#2d6a4f",
              border: `2px solid ${isDark ? "#2d4a35" : "#95d5b2"}`,
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
            }}
          >
            {showAudit ? "Hide" : "Show"} Audit Trail
          </button>
        </div>

        {/* Audit trail */}
        {showAudit && (
          <div style={{ ...card(isDark), marginTop: 16, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: `1px solid ${isDark ? "#1e3a2a" : "#e8f5e9"}`,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1rem", color: text }}>
                Score Change Audit Trail
              </div>
              <div style={{ fontSize: "0.8rem", color: muted, marginTop: 2 }}>
                Immutable log of every score change for this product
              </div>
            </div>
            {auditLoading ? (
              <div style={{ padding: 32, display: "flex", justifyContent: "center" }}>
                <Spinner />
              </div>
            ) : !audit || audit.total_entries === 0 ? (
              <div
                style={{
                  padding: "24px 20px",
                  color: muted,
                  textAlign: "center",
                  fontSize: "0.9rem",
                }}
              >
                No score changes recorded — score has been stable since initial scoring.
              </div>
            ) : (
              <div>
                {audit.audit_entries.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    style={{
                      padding: "12px 20px",
                      borderBottom: `1px solid ${isDark ? "#1e3a2a" : "#f0f7f2"}`,
                      fontSize: "0.85rem",
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                    >
                      <span style={{ color: muted }}>
                        {new Date(entry.changed_at).toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: entry.new_score > entry.old_score ? "#27ae60" : "#e74c3c",
                        }}
                      >
                        {entry.old_score?.toFixed(1)} → {entry.new_score?.toFixed(1)}
                      </span>
                    </div>
                    {entry.paying_client && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(231,76,60,0.12)",
                          color: "#e74c3c",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        Paying client
                      </span>
                    )}
                  </div>
                ))}
                <div
                  style={{
                    padding: "10px 20px",
                    color: muted,
                    fontSize: "0.8rem",
                    textAlign: "right",
                  }}
                >
                  {audit.total_entries} total {audit.total_entries === 1 ? "entry" : "entries"}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliance note */}
        <div
          style={{
            marginTop: 24,
            padding: "14px 18px",
            borderRadius: 10,
            background: isDark ? "rgba(64,145,108,0.1)" : "rgba(64,145,108,0.06)",
            border: `1px solid ${isDark ? "#2d4a35" : "#b7e4c7"}`,
            fontSize: "0.8rem",
            color: muted,
          }}
        >
          This passport is generated in accordance with GreenGrade Methodology v
          {passport.methodology_version}. Suitable for EU ESPR product disclosure and SGX Scope 3
          supplier reporting.{" "}
          <Link
            href="/methodology"
            style={{ color: "#40916c", textDecoration: "none", fontWeight: 600 }}
          >
            View methodology →
          </Link>
        </div>
      </div>
    </div>
  );
}
