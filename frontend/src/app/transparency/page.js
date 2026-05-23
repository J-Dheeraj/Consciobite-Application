"use client";
import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const SectionCard = ({ title, icon, children, isDark }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      animation: "fadeInUp 0.4s ease both",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      {icon && <span style={{ fontSize: "1.3rem" }}>{icon}</span>}
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          margin: 0,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const PledgeItem = ({ icon, title, desc, isDark }) => (
  <div
    style={{
      display: "flex",
      gap: 14,
      padding: "14px 0",
      borderBottom: `1px solid ${isDark ? "#2d4a35" : "#eee"}`,
    }}
  >
    <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
    <div>
      <div
        style={{
          fontWeight: 700,
          fontSize: "0.9rem",
          marginBottom: 4,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "0.85rem", color: isDark ? "#b0c4b1" : "#555", lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  </div>
);

const BoardSeat = ({ role, title, purpose, isDark }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 10,
      background: isDark ? "#1c2e22" : "#f8faf8",
      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
      marginBottom: 10,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span
        style={{
          padding: "2px 10px",
          borderRadius: 12,
          background: "#2d6a4f",
          color: "#fff",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {role}
      </span>
      <span
        style={{
          fontWeight: 600,
          fontSize: "0.88rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </span>
    </div>
    <p
      style={{
        fontSize: "0.83rem",
        color: isDark ? "#b0c4b1" : "#555",
        lineHeight: 1.55,
        margin: 0,
      }}
    >
      {purpose}
    </p>
  </div>
);

const PLEDGES = [
  {
    icon: "⚖️",
    title: "Deterministic, fee-independent scoring",
    desc: "GreenGrade scores are computed from a fixed algorithm (KDE density estimation + sigmoid normalisation across 7 lifecycle emission dimensions). The formula produces an identical score for identical input data regardless of whether a brand is a paying client.",
  },
  {
    icon: "🔍",
    title: "Complete audit trail",
    desc: "Every score change is recorded in an append-only log that flags whether the product belongs to a paying client. Aggregate statistics are reviewable by the advisory board at any time.",
  },
  {
    icon: "📊",
    title: "Public methodology",
    desc: "The full scoring algorithm, data sources, confidence tiers, and known limitations are published at /methodology and updated whenever the algorithm changes.",
  },
  {
    icon: "🛡️",
    title: "No manual score overrides",
    desc: "There is no mechanism in the codebase to override a product’s calculated score. All scores are recalculated from source emission data on every model retrain.",
  },
  {
    icon: "🌍",
    title: "Regulatory alignment",
    desc: "Governance practices are designed to satisfy the EU Green Claims Directive (2026) and Singapore’s upcoming mandatory environmental labelling standards.",
  },
];

const BOARD_SEATS = [
  {
    role: "Academic",
    title: "Sustainability / Food-Science Researcher",
    purpose:
      "Provides scientific credibility. Reviews the statistical basis of the KDE scoring model, validates emission factor sources, and signs off on methodology changes.",
  },
  {
    role: "Regulator",
    title: "Civil Servant (e.g. Singapore Food Agency)",
    purpose:
      "Provides regulatory legitimacy. Ensures scoring practices align with current and forthcoming food-labelling regulations in Singapore and the wider APAC region.",
  },
  {
    role: "Industry",
    title: "Industry Professional (non-paying client)",
    purpose:
      "Provides practical relevance. Must not be a current Consciobite paying client. Brings supply-chain expertise without a financial conflict of interest.",
  },
];

const BOARD_MANDATE = [
  "Annual audit of GreenGrade scoring parameters (weights, thresholds, category baselines)",
  "Mandatory sign-off before any algorithm change takes effect",
  "Published annual audit summary, freely available on this page",
  "Conflict-of-interest register — board members must declare and recuse on relevant products",
];

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textColor = isDark ? "#b0c4b1" : "#555";

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
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
            opacity: 0.05,
            backgroundImage:
              "radial-gradient(circle at 25% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 50%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "2.2rem", marginBottom: 10 }}>{"🛡️"}</div>
          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              marginBottom: 8,
            }}
          >
            Grading Independence &amp; Governance
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 560,
              margin: "0 auto 16px",
              lineHeight: 1.6,
            }}
          >
            Consciobite charges manufacturers for listing. GreenGrade scores claim to be objective.
            Here is exactly how we keep those two things separate.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {["Deterministic algorithm", "Audit trail", "Independent board"].map((label) => (
              <span
                key={label}
                style={{
                  padding: "4px 14px",
                  borderRadius: 20,
                  background: "rgba(82,183,136,0.2)",
                  color: "#52b788",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "24px 20px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Conflict of interest statement */}
        <SectionCard title="The Conflict of Interest We Acknowledge" icon="⚠️" isDark={isDark}>
          <p style={{ fontSize: "0.9rem", color: textColor, lineHeight: 1.7, marginBottom: 12 }}>
            Our business model creates an inherent tension: we are paid by manufacturers whose
            products we also score. Left unaddressed, this creates a plausible allegation of
            pay-to-win scoring.
          </p>
          <p style={{ fontSize: "0.9rem", color: textColor, lineHeight: 1.7 }}>
            We address it through three interlocking controls: a{" "}
            <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
              deterministic algorithm
            </strong>{" "}
            with no manual override, an{" "}
            <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>append-only audit log</strong>{" "}
            that flags paying-client score changes, and an{" "}
            <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
              independent advisory board
            </strong>{" "}
            that reviews methodology annually.
          </p>
        </SectionCard>

        {/* Independence pledges */}
        <SectionCard title="Independence Pledges" icon="⚖️" isDark={isDark}>
          <div>
            {PLEDGES.map((p, i) => (
              <PledgeItem key={i} {...p} isDark={isDark} />
            ))}
          </div>
        </SectionCard>

        {/* Advisory board */}
        <SectionCard title="Independent Grading Advisory Board" icon="🏛️" isDark={isDark}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(243,156,18,0.15)",
              color: "#f39c12",
              fontSize: "0.78rem",
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#f39c12",
                display: "inline-block",
              }}
            />
            Board formation in progress
          </div>

          <p style={{ fontSize: "0.9rem", color: textColor, lineHeight: 1.7, marginBottom: 16 }}>
            An independent advisory board of three members audits our grading methodology and must
            sign off on any algorithm changes. Each seat is held by a different type of stakeholder
            to prevent single-domain capture.
          </p>

          {BOARD_SEATS.map((seat) => (
            <BoardSeat key={seat.role} {...seat} isDark={isDark} />
          ))}

          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                marginBottom: 8,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              Board mandate
            </div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {BOARD_MANDATE.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.86rem",
                    color: textColor,
                    lineHeight: 1.65,
                    marginBottom: 6,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Audit trail */}
        <SectionCard title="Score Change Audit Trail" icon="📄" isDark={isDark}>
          <p style={{ fontSize: "0.9rem", color: textColor, lineHeight: 1.7, marginBottom: 14 }}>
            Every time the GreenGrade model is retrained or scoring parameters change, each product
            is rescored. Differences from the previous score are written to an append-only log that
            includes:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "product_id / product_name", desc: "Which product changed" },
              { label: "old_score / new_score / score_delta", desc: "What the change was" },
              {
                label: "is_paying_client",
                desc: "Whether the brand is a paying Consciobite client",
              },
              { label: "changed_at / changed_by / change_reason", desc: "Why and when" },
            ].map(({ label, desc }) => (
              <div
                key={label}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <code
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.78rem",
                    color: isDark ? "#95d5b2" : "#2d6a4f",
                    flexShrink: 0,
                    minWidth: 180,
                  }}
                >
                  {label}
                </code>
                <span style={{ fontSize: "0.83rem", color: textColor }}>{desc}</span>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: "0.85rem",
              color: textColor,
              lineHeight: 1.65,
              marginTop: 14,
            }}
          >
            Aggregate statistics (total changes, average delta, increases vs decreases — broken down
            by paying vs non-paying clients) are available to board members via a protected admin
            dashboard.
          </p>
        </SectionCard>

        {/* Algorithm integrity */}
        <SectionCard title="Algorithm Integrity" icon="🧩" isDark={isDark}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}
          >
            {[
              { label: "Scoring model", value: "Kernel Density Estimation (KDE)" },
              { label: "Normalisation", value: "Sigmoid function (0–10 scale)" },
              { label: "Dimensions", value: "7 lifecycle emission stages" },
              { label: "Override mechanism", value: "None — deterministic output only" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#edf7f0",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.65 }}>
            Scoring parameters (bandwidth, sigmoid steepness, category baselines) are
            version-controlled. Any change requires advisory board sign-off and is logged with a
            reason and timestamp before deployment.
          </p>
          <div style={{ marginTop: 14 }}>
            <Link
              href="/methodology"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#edf7f0",
                color: isDark ? "#74c69d" : "#2d6a4f",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
                border: `1px solid ${isDark ? "#2d4a35" : "#b7e4c7"}`,
              }}
            >
              {"📊"} Read full methodology
            </Link>
          </div>
        </SectionCard>

        {/* Regulatory alignment */}
        <SectionCard title="Regulatory Alignment" icon="🌍" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                region: "European Union",
                directive: "EU Green Claims Directive (2026)",
                status: "Aligned",
                desc: "Substantiation of environmental claims, third-party verification, and prohibition of generic unsubstantiated claims. Our audit trail and advisory board structure pre-empt these requirements.",
              },
              {
                region: "Singapore",
                directive: "Mandatory Environmental Labelling (MAS / NEA)",
                status: "Monitoring",
                desc: "We track Singapore Food Agency and NEA guidance on product-level environmental disclosures. Our methodology page provides the disclosure basis required for future compliance.",
              },
            ].map(({ region, directive, status, desc }) => (
              <div
                key={region}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                    }}
                  >
                    {region}
                  </span>
                  <span
                    style={{
                      padding: "1px 8px",
                      borderRadius: 10,
                      background:
                        status === "Aligned" ? "rgba(39,174,96,0.15)" : "rgba(243,156,18,0.15)",
                      color: status === "Aligned" ? "#27ae60" : "#f39c12",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  >
                    {status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 6,
                    fontStyle: "italic",
                  }}
                >
                  {directive}
                </div>
                <p style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.55, margin: 0 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Contact */}
        <div
          style={{
            padding: "20px 24px",
            borderRadius: 14,
            background: isDark
              ? "linear-gradient(135deg, #162419, #1c2e22)"
              : "linear-gradient(135deg, #d8f3dc, #b7e4c7)",
            border: `1px solid ${isDark ? "#2d4a35" : "#95d5b2"}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>{"📬"}</div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: 6,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            Questions about our governance?
          </div>
          <p
            style={{
              fontSize: "0.88rem",
              color: isDark ? "#b0c4b1" : "#2d6a4f",
              margin: "0 0 14px",
            }}
          >
            If you are a regulator, retailer, or researcher and would like to review our methodology
            or audit logs, contact us directly.
          </p>
          <Link
            href="/about"
            style={{
              display: "inline-block",
              padding: "9px 22px",
              borderRadius: 10,
              background: "#2d6a4f",
              color: "#fff",
              fontSize: "0.88rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Contact the team
          </Link>
        </div>
      </div>
    </div>
  );
}
