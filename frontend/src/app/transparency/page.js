"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchMethodology } from "@/services/api";
import Spinner from "@/components/Spinner";

const Card = ({ children, isDark, accent }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      borderLeft: accent ? `3px solid ${accent}` : undefined,
    }}
  >
    {children}
  </div>
);

const SectionHeading = ({ children, isDark }) => (
  <h2
    style={{
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800,
      fontSize: "1.15rem",
      color: isDark ? "#e8f5e9" : "#1a3a2a",
      marginBottom: 16,
    }}
  >
    {children}
  </h2>
);

const BodyText = ({ children, isDark, style }) => (
  <p
    style={{
      fontSize: "0.9rem",
      color: isDark ? "#b0c4b1" : "#555",
      lineHeight: 1.7,
      ...style,
    }}
  >
    {children}
  </p>
);

const CheckItem = ({ children, isDark }) => (
  <li
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      fontSize: "0.88rem",
      color: isDark ? "#b0c4b1" : "#555",
      lineHeight: 1.7,
      marginBottom: 6,
      listStyle: "none",
    }}
  >
    <span style={{ color: "#52b788", fontWeight: 700, flexShrink: 0 }}>✓</span>
    {children}
  </li>
);

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading } = useQuery({
    queryKey: ["methodology"],
    queryFn: fetchMethodology,
  });

  const gov = data?.governance;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d2818 0%, #1b4332 60%, #2d6a4f 100%)",
          padding: "52px 24px",
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
              "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 14px",
              borderRadius: 20,
              background: "rgba(82,183,136,0.15)",
              color: "#52b788",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <span>&#x1F6E1;</span> Governance Commitment
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
            Transparency Report
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.95rem",
              maxWidth: 560,
              margin: "0 auto 20px",
              lineHeight: 1.7,
            }}
          >
            How we keep GreenGrade scoring independent, what safeguards are in place, and who
            oversees our methodology.
          </p>
          <Link
            href="/methodology"
            style={{
              display: "inline-block",
              padding: "10px 22px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            Technical methodology &rarr;
          </Link>
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
        {isLoading ? (
          <Spinner message="Loading..." />
        ) : (
          <>
            {/* Independence commitment */}
            <Card isDark={isDark} accent="#52b788">
              <SectionHeading isDark={isDark}>Our Independence Commitment</SectionHeading>
              <BodyText isDark={isDark} style={{ marginBottom: 16 }}>
                {gov?.independenceStatement ??
                  "GreenGrade scores are determined solely by lifecycle emission data and statistical methodology. Manufacturer listing fees are non-contingent on score outcomes."}
              </BodyText>
              <BodyText isDark={isDark}>
                Consciobite operates a revenue model where manufacturers pay to list and grade their
                products. We recognise this creates a potential conflict of interest and have put
                structural safeguards in place to ensure scoring integrity.
              </BodyText>
            </Card>

            {/* Scoring integrity */}
            <Card isDark={isDark}>
              <SectionHeading isDark={isDark}>Technical Safeguards</SectionHeading>
              <BodyText isDark={isDark} style={{ marginBottom: 14 }}>
                The following technical controls are active in production:
              </BodyText>
              <ul style={{ padding: 0, margin: 0 }}>
                {(gov?.scoringIntegrity ?? []).map((item, i) => (
                  <CheckItem key={i} isDark={isDark}>
                    {item}
                  </CheckItem>
                ))}
              </ul>
            </Card>

            {/* Advisory board */}
            <Card isDark={isDark}>
              <SectionHeading isDark={isDark}>Independent Advisory Board</SectionHeading>
              <BodyText isDark={isDark} style={{ marginBottom: 16 }}>
                {gov?.advisoryBoard.description}
              </BodyText>

              {/* Board mandate */}
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                  marginBottom: 8,
                }}
              >
                Board Mandate
              </div>
              <ul style={{ padding: 0, margin: "0 0 20px" }}>
                {(gov?.advisoryBoard.mandate ?? []).map((item, i) => (
                  <CheckItem key={i} isDark={isDark}>
                    {item}
                  </CheckItem>
                ))}
              </ul>

              {/* Seats */}
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                  marginBottom: 10,
                }}
              >
                Board Seats
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(gov?.advisoryBoard.vacancies ?? []).map((v) => (
                  <div
                    key={v.seat}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: isDark ? "#1c2e22" : "#f8faf8",
                      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                    }}
                  >
                    <div style={{ flexShrink: 0, paddingTop: 2 }}>
                      <span
                        style={{
                          padding: "3px 12px",
                          borderRadius: 12,
                          background: isDark ? "#2d4a35" : "#d8f3dc",
                          color: isDark ? "#95d5b2" : "#2d6a4f",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {v.seat}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: isDark ? "#b0c4b1" : "#555",
                          lineHeight: 1.5,
                          marginBottom: 4,
                        }}
                      >
                        {v.description}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "1px 8px",
                          borderRadius: 8,
                          background: "rgba(243,156,18,0.12)",
                          color: "#f39c12",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                        }}
                      >
                        Seat {v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {gov?.advisoryBoard.members?.length === 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 16px",
                    borderRadius: 10,
                    background: isDark ? "#1a2420" : "#fffbeb",
                    border: `1px solid ${isDark ? "#3a3020" : "#fde68a"}`,
                    fontSize: "0.83rem",
                    color: isDark ? "#c8b560" : "#92400e",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Board formation in progress.</strong> We are currently recruiting
                  independent board members. If you are a sustainability researcher, food safety
                  regulator, or industry expert interested in contributing, please contact us.
                </div>
              )}
            </Card>

            {/* Regulatory alignment */}
            <Card isDark={isDark}>
              <SectionHeading isDark={isDark}>Regulatory Alignment</SectionHeading>
              <BodyText isDark={isDark} style={{ marginBottom: 14 }}>
                GreenGrade&apos;s methodology is designed to align with the following frameworks:
              </BodyText>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(gov?.regulatoryAlignment ?? []).map((item, i) => {
                  const [title, ...rest] = item.split(" — ");
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: isDark ? "#1c2e22" : "#f8faf8",
                        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: isDark ? "#e8f5e9" : "#1a3a2a",
                          marginBottom: 2,
                        }}
                      >
                        {title}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888" }}>
                        {rest.join(" — ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Further reading */}
            <Card isDark={isDark}>
              <SectionHeading isDark={isDark}>Further Reading</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  {
                    href: "/methodology",
                    label: "Scoring Methodology",
                    desc: "Technical documentation of the GreenGrade v3 algorithm, data tiers, and emission dimensions.",
                  },
                  {
                    href: "/about",
                    label: "About Consciobite",
                    desc: "Our mission, team, and approach to making sustainable food choices accessible.",
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "block",
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: isDark ? "#1c2e22" : "#f8faf8",
                      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        color: isDark ? "#95d5b2" : "#2d6a4f",
                        marginBottom: 3,
                      }}
                    >
                      {item.label} &rarr;
                    </div>
                    <div style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888" }}>
                      {item.desc}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
