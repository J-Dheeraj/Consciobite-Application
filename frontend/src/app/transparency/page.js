"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const Card = ({ children, isDark, accent }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      borderLeft: accent ? `4px solid ${accent}` : undefined,
      animation: "fadeInUp 0.4s ease both",
    }}
  >
    {children}
  </div>
);

const SectionHeading = ({ icon, title, subtitle, isDark }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: "1.3rem" }}>{icon}</span>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.2rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
    {subtitle && (
      <p
        style={{
          fontSize: "0.88rem",
          color: isDark ? "#7a9a7e" : "#888",
          margin: 0,
          paddingLeft: 36,
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

const BoardSeat = ({ seatRole, description, requirement, status, isDark }) => (
  <div
    style={{
      padding: "16px 18px",
      borderRadius: 12,
      background: isDark ? "#1c2e22" : "#f8faf8",
      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
      marginBottom: 10,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span
        style={{
          padding: "2px 10px",
          borderRadius: 12,
          background: status === "forming" ? "rgba(243,156,18,0.15)" : "rgba(39,174,96,0.15)",
          color: status === "forming" ? "#f39c12" : "#27ae60",
          fontSize: "0.72rem",
          fontWeight: 700,
        }}
      >
        {status === "forming" ? "Forming" : "Filled"}
      </span>
      <span
        style={{
          fontWeight: 700,
          fontSize: "0.95rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {seatRole}
      </span>
    </div>
    <p
      style={{
        fontSize: "0.85rem",
        color: isDark ? "#b0c4b1" : "#555",
        lineHeight: 1.6,
        marginBottom: 6,
      }}
    >
      {description}
    </p>
    <p style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#888", fontStyle: "italic" }}>
      Requirement: {requirement}
    </p>
  </div>
);

const CommitmentRow = ({ label, detail, isDark }) => (
  <div
    style={{
      display: "flex",
      gap: 14,
      padding: "12px 0",
      borderBottom: `1px solid ${isDark ? "#2d4a35" : "#eee"}`,
    }}
  >
    <span style={{ color: "#27ae60", fontSize: "1rem", flexShrink: 0, marginTop: 2 }}>
      &#10003;
    </span>
    <div>
      <div
        style={{
          fontWeight: 600,
          fontSize: "0.9rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "0.83rem", color: isDark ? "#b0c4b1" : "#666", lineHeight: 1.55 }}>
        {detail}
      </div>
    </div>
  </div>
);

const Disclosure = ({ question, answer, isDark }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: `1px solid ${isDark ? "#2d4a35" : "#eee"}`,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: "14px 0",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          fontWeight: 600,
          fontSize: "0.9rem",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {question}
        <span
          style={{
            fontSize: "1rem",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: isDark ? "#7a9a7e" : "#888",
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          &#x25BE;
        </span>
      </button>
      {open && (
        <p
          style={{
            fontSize: "0.87rem",
            color: isDark ? "#b0c4b1" : "#555",
            lineHeight: 1.65,
            paddingBottom: 14,
            margin: 0,
          }}
        >
          {answer}
        </p>
      )}
    </div>
  );
};

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
            opacity: 0.06,
            backgroundImage:
              "radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px, 35px 35px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              marginBottom: 8,
            }}
          >
            Transparency & Independence
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 560,
              margin: "0 auto 16px",
            }}
          >
            How we protect the integrity of GreenGrade scoring when manufacturers pay for listing
            &mdash; and why our governance structure ensures scores are never for sale.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Open Algorithm", color: "#52b788" },
              { label: "Independent Advisory Board", color: "#74c69d" },
              { label: "Score Audit Trail", color: "#95d5b2" },
            ].map((badge) => (
              <span
                key={badge.label}
                style={{
                  padding: "4px 14px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.1)",
                  color: badge.color,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "28px 20px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* The conflict we acknowledge */}
        <Card isDark={isDark} accent="#f39c12">
          <SectionHeading
            icon="&#x26A0;&#xFE0F;"
            title="The Conflict We Acknowledge"
            isDark={isDark}
          />
          <p style={{ fontSize: "0.9rem", color: textColor, lineHeight: 1.7, marginBottom: 14 }}>
            Consciobite charges manufacturers a listing fee to have their products scored on the
            platform. At the same time, GreenGrade scores claim to be objective and independent.
            This creates a structural conflict of interest that we take seriously.
          </p>
          <p style={{ fontSize: "0.9rem", color: textColor, lineHeight: 1.7, marginBottom: 14 }}>
            Our response is not to deny the tension but to address it directly through governance:
            an independent advisory board, an immutable audit trail for every score change, and a
            public commitment that{" "}
            <strong style={{ color: isDark ? "#95d5b2" : "#2d6a4f" }}>
              listing fees are never contingent on score outcome
            </strong>
            .
          </p>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
              fontSize: "0.85rem",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              fontWeight: 600,
            }}
          >
            A manufacturer&rsquo;s score is calculated by the same deterministic algorithm applied
            to all 550+ products &mdash; paying or not. No human can override it.
          </div>
        </Card>

        {/* Independence commitments */}
        <Card isDark={isDark}>
          <SectionHeading
            icon="&#x1F6E1;&#xFE0F;"
            title="Independence Commitments"
            subtitle="What we promise and how we enforce it"
            isDark={isDark}
          />
          <CommitmentRow
            label="Score-blind listing fees"
            detail="Manufacturers pay a flat listing fee regardless of their GreenGrade score. No premium for a better grade, no discount for a worse one."
            isDark={isDark}
          />
          <CommitmentRow
            label="Algorithm-only scoring"
            detail="GreenGrade scores are computed entirely by the KDE + sigmoid algorithm trained on the full product catalog. No staff member can manually adjust a score."
            isDark={isDark}
          />
          <CommitmentRow
            label="Immutable audit trail"
            detail="Every score change &mdash; including model retrains &mdash; is logged with a timestamp, the old score, the new score, and a flag indicating whether the product has a paying manufacturer. The log is append-only."
            isDark={isDark}
          />
          <CommitmentRow
            label="Advisory board sign-off for algorithm changes"
            detail="Any change to scoring parameters (dimension weights, sigmoid constants, category definitions) requires approval from the Independent Grading Advisory Board before deployment."
            isDark={isDark}
          />
          <CommitmentRow
            label="Annual public audit"
            detail="The advisory board publishes an annual audit summary covering: methodology accuracy, score distribution fairness across paying vs. non-paying products, and any parameter changes made during the year."
            isDark={isDark}
          />
        </Card>

        {/* Advisory board */}
        <Card isDark={isDark}>
          <SectionHeading
            icon="&#x1F3DB;&#xFE0F;"
            title="Independent Grading Advisory Board"
            subtitle="Three-seat board with a mandatory rotating non-client industry representative"
            isDark={isDark}
          />
          <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.65, marginBottom: 16 }}>
            The board audits GreenGrade methodology independently of Consciobite management. Members
            serve two-year terms and must declare conflicts of interest before any vote. Board
            minutes are published quarterly.
          </p>

          <BoardSeat
            seatRole="Academic Researcher"
            description="A sustainability or food-systems researcher from an accredited university. Provides scientific credibility and peer-review perspective on the KDE scoring model."
            requirement="PhD in environmental science, food science, or related field. No financial ties to Consciobite clients."
            status="forming"
            isDark={isDark}
          />
          <BoardSeat
            seatRole="Regulatory Representative"
            description="A civil servant or former regulator, preferably from Singapore Food Agency (SFA) or an equivalent food-safety or environmental body. Provides regulatory legitimacy and pre-empts compliance risk."
            requirement="Current or former senior role in a government food or environmental agency. Non-voting advisory capacity if serving concurrently in government."
            status="forming"
            isDark={isDark}
          />
          <BoardSeat
            seatRole="Industry Representative"
            description="A food-industry professional who is not a paying Consciobite client and has no commercial interest in any scored product. Provides practical relevance without conflict."
            requirement="Senior experience in food manufacturing or retail. Must not be employed by or hold equity in any Consciobite client. Verified annually."
            status="forming"
            isDark={isDark}
          />

          <div
            style={{
              marginTop: 14,
              padding: "12px 16px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#fff8e6",
              border: `1px solid ${isDark ? "#4a3a1a" : "#f0d080"}`,
              fontSize: "0.83rem",
              color: isDark ? "#c8a84a" : "#7a5a00",
            }}
          >
            <strong>Board formation in progress.</strong> We are currently recruiting board members.
            If you are a researcher or regulator interested in this role, contact us at{" "}
            <a href="mailto:governance@consciobite.sg" style={{ color: "inherit" }}>
              governance@consciobite.sg
            </a>
            .
          </div>
        </Card>

        {/* Score integrity */}
        <Card isDark={isDark}>
          <SectionHeading
            icon="&#x1F4CA;"
            title="Score Integrity Mechanisms"
            subtitle="Technical controls that make score manipulation structurally impossible"
            isDark={isDark}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[
              {
                title: "Deterministic algorithm",
                detail:
                  "Same inputs always produce the same score. No randomness, no manual override.",
              },
              {
                title: "Batch scoring",
                detail:
                  "All 550+ products are scored together on every model retrain. A paying client cannot be selectively re-scored.",
              },
              {
                title: "Paying-client flag in audit log",
                detail:
                  "Every score change record includes whether the manufacturer is a paying client, enabling independent statistical audits.",
              },
              {
                title: "Open methodology",
                detail:
                  "The full algorithm, dimension weights, and data sources are documented on the Methodology page.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                    marginBottom: 6,
                  }}
                >
                  {item.title}
                </div>
                <p style={{ fontSize: "0.82rem", color: textColor, lineHeight: 1.55, margin: 0 }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ / Disclosures */}
        <Card isDark={isDark}>
          <SectionHeading icon="&#x2753;" title="Common Questions" isDark={isDark} />
          <Disclosure
            question="Can a manufacturer pay to improve their GreenGrade score?"
            answer="No. Listing fees give manufacturers presence on the platform, not influence over their score. The GreenGrade algorithm scores every product identically based on its lifecycle emission data across 7 dimensions. A manufacturer cannot contact us to change their score — there is no mechanism for that, and the advisory board's audit trail would flag any anomaly."
            isDark={isDark}
          />
          <Disclosure
            question="What happens when the scoring algorithm is updated?"
            answer="Algorithm updates require advisory board approval. When approved, all 550+ products are rescored simultaneously. The system logs which products changed score, by how much, and flags whether they have paying manufacturers. This data is available to the advisory board for the annual audit and will eventually be published in aggregate form on this page."
            isDark={isDark}
          />
          <Disclosure
            question="Why do you charge manufacturers at all?"
            answer="Running a product database with lifecycle emission analysis for 550+ products requires significant data sourcing and engineering costs. Listing fees are how Consciobite is sustainable as a business. The governance structure exists precisely because we believe this funding model can coexist with score independence &mdash; but only with explicit structural safeguards."
            isDark={isDark}
          />
          <Disclosure
            question="How is emission data for products collected?"
            answer="Emission data for each product is sourced from peer-reviewed lifecycle assessment (LCA) databases including Poore & Nemecek (2018, Science), Our World in Data, and the Carbon Trust. Products are matched to the closest food category archetype. Actual per-product measurements are not yet available for every item &mdash; see the Methodology page for data tiers and confidence scoring."
            isDark={isDark}
          />
          <Disclosure
            question="Who can I contact about governance concerns?"
            answer="Governance questions, conflict-of-interest reports, or requests to view the score audit summary can be sent to governance@consciobite.sg. Board members will be listed here with their contact details once the board is formed."
            isDark={isDark}
          />
        </Card>

        {/* Regulatory alignment */}
        <Card isDark={isDark}>
          <SectionHeading
            icon="&#x1F310;"
            title="Regulatory Alignment"
            subtitle="Frameworks we design for"
            isDark={isDark}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                name: "EU Green Claims Directive",
                description:
                  "Requires that environmental claims be substantiated with lifecycle assessment evidence and verified by an accredited third party. Our scoring uses LCA-based emission data and the advisory board serves as our independent verification body.",
                status: "Preparing",
              },
              {
                name: "Singapore Green Plan 2030",
                description:
                  "Singapore's national sustainability roadmap. Consciobite supports consumer education on food system emissions, aligning with the Sustainable Living and Green Economy pillars.",
                status: "Aligned",
              },
              {
                name: "ISO 14040/44 (LCA Standard)",
                description:
                  "The international standard for lifecycle assessment methodology. Our emission data sources follow ISO 14040/44-compliant LCA studies. We do not yet have ISO 14040 certification for our own methodology.",
                status: "Preparing",
              },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: 10,
                      background:
                        item.status === "Aligned"
                          ? "rgba(39,174,96,0.15)"
                          : "rgba(243,156,18,0.15)",
                      color: item.status === "Aligned" ? "#27ae60" : "#f39c12",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {item.status}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
                <p style={{ fontSize: "0.84rem", color: textColor, lineHeight: 1.55, margin: 0 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Call to action */}
        <div
          style={{
            textAlign: "center",
            padding: "28px 24px",
            borderRadius: 14,
            background: isDark
              ? "linear-gradient(135deg, #1b4332, #2d6a4f)"
              : "linear-gradient(135deg, #d8f3dc, #b7e4c7)",
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 8,
            }}
          >
            Read the full scoring algorithm
          </h3>
          <p
            style={{
              fontSize: "0.88rem",
              color: isDark ? "#b0c4b1" : "#555",
              marginBottom: 20,
              maxWidth: 440,
              margin: "0 auto 20px",
            }}
          >
            The Methodology page documents every dimension, data source, and formula used to
            calculate GreenGrade scores.
          </p>
          <Link
            href="/methodology"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 10,
              background: isDark ? "#52b788" : "#2d6a4f",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.92rem",
              textDecoration: "none",
            }}
          >
            View Methodology
          </Link>
        </div>
      </div>
    </div>
  );
}
