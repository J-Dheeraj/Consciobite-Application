"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparencyStats } from "@/services/admin";
import { getCatalogExportUrl } from "@/services/products";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

const GOVERNANCE_CONFIG = {
  panelName: "GreenGrade Advisory Panel",
  methodologyVersion: "v3.0",
  lastReviewDate: null,
  nextReviewDate: "2026-12-01",
  panelSeats: [
    {
      role: "Academic Researcher",
      focus: "Life Cycle Assessment & Food Systems",
      institution: "In formation",
      confirmed: false,
    },
    {
      role: "Regulatory Representative",
      focus: "Food Safety & Sustainability Policy",
      institution: "In formation",
      confirmed: false,
    },
    {
      role: "Industry (Non-Client)",
      focus: "Retail & Supply Chain Sustainability",
      institution: "In formation",
      confirmed: false,
    },
  ],
  commitments: [
    "Listing fees are non-contingent on GreenGrade score outcome.",
    "The Panel may request re-scoring of any listed product at any time.",
    "All score changes to paying client products are logged and available to the Panel.",
    "An annual methodology review statement will be published on this page.",
    "No Panel member may represent a paying manufacturer client.",
  ],
};

function SectionCard({ title, children, isDark }) {
  return (
    <div
      style={{
        ...card(isDark, { radius: 14 }),
        padding: 24,
        marginBottom: 20,
        animation: "fadeInUp 0.4s ease both",
      }}
    >
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          marginBottom: 14,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function SeatCard({ seat, isDark }) {
  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 18,
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 12,
            background: seat.confirmed ? "#27ae60" : isDark ? "#3a2e1c" : "#fef3c7",
            color: seat.confirmed ? "#fff" : "#92400e",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {seat.confirmed ? "Confirmed" : "In Formation"}
        </span>
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          marginBottom: 4,
        }}
      >
        {seat.role}
      </div>
      <div style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#777", marginBottom: 4 }}>
        {seat.focus}
      </div>
      <div style={{ fontSize: 12, fontStyle: "italic", color: isDark ? "#4a6a4e" : "#999" }}>
        {seat.institution}
      </div>
    </div>
  );
}

function StatRow({ label, value, isDark }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
      }}
    >
      <span style={{ color: isDark ? "#b0c4b1" : "#555", fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 700, color: isDark ? "#e8f5e9" : "#1a3a2a", fontSize: 14 }}>
        {value}
      </span>
    </div>
  );
}

export default function TransparencyPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["transparency-stats"],
    queryFn: fetchTransparencyStats,
  });

  const textColor = isDark ? "#c8d6c8" : "#444";

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔍"
        title="Transparency & Governance"
        subtitle="How we score products, who oversees us, and how we prevent conflicts of interest."
      />

      <div style={pageContainer(750)}>
        {/* The Independence Problem */}
        <SectionCard title="The Independence Problem" isDark={isDark}>
          <p style={{ color: textColor, lineHeight: 1.7, marginBottom: 12 }}>
            Consciobite charges manufacturers a listing fee to have their products scored on the
            platform. At the same time, we claim those scores are independent and scientifically
            grounded.
          </p>
          <p style={{ color: textColor, lineHeight: 1.7, margin: 0 }}>
            That combination creates a structural conflict of interest. We address it not with
            promises but with governance: an independent advisory panel, a published methodology,
            and a full audit trail of every score change — with paying-client attribution.
          </p>
        </SectionCard>

        {/* Advisory Panel */}
        <SectionCard title={GOVERNANCE_CONFIG.panelName} isDark={isDark}>
          <p style={{ color: textColor, lineHeight: 1.7, marginBottom: 16 }}>
            Three independent experts — none with any commercial relationship to Consciobite or its
            clients — audit our scoring methodology annually and can challenge any individual
            product score.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {GOVERNANCE_CONFIG.panelSeats.map((seat) => (
              <SeatCard key={seat.role} seat={seat} isDark={isDark} />
            ))}
          </div>
        </SectionCard>

        {/* Commitments */}
        <SectionCard title="Our Commitments" isDark={isDark}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {GOVERNANCE_CONFIG.commitments.map((c) => (
              <li
                key={c}
                style={{ color: textColor, lineHeight: 1.8, marginBottom: 6, fontSize: 14 }}
              >
                {c}
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Methodology */}
        <SectionCard title="Methodology" isDark={isDark}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                background: isDark ? "#1c2e22" : "#ecfdf5",
                color: "#2d6a4f",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {GOVERNANCE_CONFIG.methodologyVersion}
            </span>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                background: isDark ? "#1c2e22" : "#f3f4f6",
                color: isDark ? "#6b8a6e" : "#777",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Next review: {GOVERNANCE_CONFIG.nextReviewDate}
            </span>
          </div>
          <p style={{ color: textColor, lineHeight: 1.7, marginBottom: 12 }}>
            GreenGrade scores every product across 7 supply-chain emission categories: Land Use
            Change, Animal Feed, Farm, Processing, Transport, Packaging, and Retail. Scores use
            Gaussian Kernel Density Estimation with variance-based feature importance and a
            non-linear sigmoid transform.
          </p>
          <Link
            href="/methodology"
            style={{
              color: "#2d6a4f",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View full methodology details &rarr;
          </Link>
        </SectionCard>

        {/* Data Export */}
        <SectionCard title="Data Export" isDark={isDark}>
          <p style={{ color: textColor, lineHeight: 1.7, marginBottom: 16 }}>
            Download the full product catalog with GreenGrade scores for use in Scope 3 carbon
            reporting, EU ESPR compliance, or third-party analysis. The catalog hash (SHA-256 of
            the source data) is included so you can verify that your copy matches what
            Consciobite published.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href={getCatalogExportUrl({ format: "json" })}
              download="consciobite-catalog.json"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                background: isDark ? "#1c3a28" : "#ecfdf5",
                color: "#2d6a4f",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                border: `1px solid ${isDark ? "#2d5a3d" : "#bbf7d0"}`,
              }}
            >
              &#8595; JSON
            </a>
            <a
              href={getCatalogExportUrl({ format: "csv" })}
              download="consciobite-catalog.csv"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                background: isDark ? "#1c3a28" : "#ecfdf5",
                color: "#2d6a4f",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                border: `1px solid ${isDark ? "#2d5a3d" : "#bbf7d0"}`,
              }}
            >
              &#8595; CSV
            </a>
          </div>
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: isDark ? "#4a6a4e" : "#999",
            }}
          >
            Filters available via API: <code>?tier=green|amber|red</code> and{" "}
            <code>?category=&lt;name&gt;</code>. See{" "}
            <Link
              href="/methodology"
              style={{ color: "#2d6a4f", fontWeight: 600 }}
            >
              methodology
            </Link>{" "}
            for score definitions.
          </p>
        </SectionCard>

        {/* Score Change Statistics */}
        <SectionCard title="Score Change Statistics (Last 12 Months)" isDark={isDark}>
          {isLoading ? (
            <Spinner message="Loading statistics..." />
          ) : stats ? (
            <div>
              <StatRow isDark={isDark} label="Total products scored" value={stats.productCount} />
              <StatRow isDark={isDark} label="Total score updates" value={stats.totalChanges} />
              <StatRow
                isDark={isDark}
                label="Paying client score changes"
                value={stats.paying.count}
              />
              <StatRow
                isDark={isDark}
                label="Paying client avg delta"
                value={
                  stats.paying.count > 0
                    ? `${stats.paying.avgDelta >= 0 ? "+" : ""}${stats.paying.avgDelta}`
                    : "N/A"
                }
              />
              <StatRow
                isDark={isDark}
                label="Non-paying score changes"
                value={stats.nonPaying.count}
              />
              <StatRow
                isDark={isDark}
                label="Non-paying avg delta"
                value={
                  stats.nonPaying.count > 0
                    ? `${stats.nonPaying.avgDelta >= 0 ? "+" : ""}${stats.nonPaying.avgDelta}`
                    : "N/A"
                }
              />
              <p
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  fontStyle: "italic",
                  color: isDark ? "#4a6a4e" : "#999",
                }}
              >
                Similar average deltas across both groups indicate scoring is not influenced by
                commercial relationships. No individual product names or manufacturer names are
                disclosed.
              </p>
            </div>
          ) : null}
        </SectionCard>

        {/* Annual Review Statement */}
        <SectionCard title="Annual Review Statement" isDark={isDark}>
          <p style={{ color: textColor, lineHeight: 1.7, margin: 0 }}>
            The first annual review is scheduled for {GOVERNANCE_CONFIG.nextReviewDate}. This
            section will be updated following the review with the Panel&apos;s findings and
            statement.
          </p>
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contact" isDark={isDark}>
          <p style={{ color: textColor, lineHeight: 1.7, margin: 0 }}>
            For Panel enquiries, methodology questions, or to report a concern about a specific
            product score, contact{" "}
            <a
              href="mailto:governance@consciobite.com"
              style={{ color: "#2d6a4f", fontWeight: 600 }}
            >
              governance@consciobite.com
            </a>
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
