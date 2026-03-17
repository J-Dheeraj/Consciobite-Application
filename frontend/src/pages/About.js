import React from "react";
import { useTheme } from "../context/ThemeContext";

const TeamMember = ({ name, emoji, isDark }) => (
  <div style={{ textAlign: "center", padding: 16 }}>
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: isDark
          ? "linear-gradient(135deg, #1c2e22, #2d4a35)"
          : "linear-gradient(135deg, #d8f3dc, #b7e4c7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 8px",
        fontSize: "1.5rem",
      }}
    >
      {emoji}
    </div>
    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: isDark ? "#e8f5e9" : "inherit" }}>
      {name}
    </div>
  </div>
);

const InfoCard = ({ icon, title, children, isDark }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      animation: "fadeInUp 0.4s ease both",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: "1.3rem" }}>{icon}</span>
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.05rem" }}>
        {title}
      </h3>
    </div>
    {children}
  </div>
);

export default function About() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
          <div
            style={{
              fontSize: "2.5rem",
              marginBottom: 12,
              animation: "float 3s ease-in-out infinite",
            }}
          >
            {"\uD83C\uDF0D"}
          </div>
          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              marginBottom: 8,
            }}
          >
            About Consciobite
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Empowering sustainable food choices through transparent environmental data.
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "24px 20px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <InfoCard icon={"\uD83C\uDF31"} title="Our Mission" isDark={isDark}>
          <p style={{ color: isDark ? "#b0c4b1" : "#555", fontSize: "0.9rem", lineHeight: 1.7 }}>
            We empower consumers to make informed, sustainable food choices by providing transparent
            environmental impact data through our proprietary GreenGrade scoring system.
          </p>
        </InfoCard>

        <InfoCard icon={"\uD83D\uDCCA"} title="How GreenGrade Works" isDark={isDark}>
          <p
            style={{
              color: isDark ? "#b0c4b1" : "#555",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              marginBottom: 14,
            }}
          >
            Our algorithm evaluates carbon emissions across seven categories of the food supply
            chain: Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, and Retail.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#edf7f0",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#2d6a4f",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  flexShrink: 0,
                }}
              >
                7+
              </div>
              <div>
                <strong style={{ color: "#2d6a4f" }}>Green (7-10)</strong>{" "}
                <span style={{ color: isDark ? "#7a9a7e" : "#666", fontSize: "0.85rem" }}>
                  {"\u2014"} Low environmental impact
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: isDark ? "#2a2517" : "#fff8e1",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#e9c46a",
                  color: "#1a1a2e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  flexShrink: 0,
                }}
              >
                4+
              </div>
              <div>
                <strong style={{ color: isDark ? "#e9c46a" : "#8a6d00" }}>Yellow (4-6.9)</strong>{" "}
                <span style={{ color: isDark ? "#7a9a7e" : "#666", fontSize: "0.85rem" }}>
                  {"\u2014"} Moderate impact
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: isDark ? "#2a1519" : "#fef2f2",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#e63946",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  flexShrink: 0,
                }}
              >
                0+
              </div>
              <div>
                <strong style={{ color: isDark ? "#f87171" : "#c5303c" }}>Red (0-3.9)</strong>{" "}
                <span style={{ color: isDark ? "#7a9a7e" : "#666", fontSize: "0.85rem" }}>
                  {"\u2014"} High impact
                </span>
              </div>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={"\u26A0\uFE0F"} title="The Problem We Solve" isDark={isDark}>
          <p style={{ color: isDark ? "#b0c4b1" : "#555", fontSize: "0.9rem", lineHeight: 1.7 }}>
            Nearly 45% of consumers are uninformed about the environmental practices of the brands
            they support. With Gen Z poised to become the dominant workforce, two-thirds of whom
            advocate for sustainable food production, the demand for transparency has never been
            greater.
          </p>
        </InfoCard>

        <InfoCard icon={"\uD83D\uDE80"} title="Market Opportunity" isDark={isDark}>
          <p style={{ color: isDark ? "#b0c4b1" : "#555", fontSize: "0.9rem", lineHeight: 1.7 }}>
            The ethical labelling market is projected to grow at a CAGR of 6.51%, reaching a
            potential market value of USD 372.7 billion by 2026. Consciobite is positioned to be a
            key player in this space.
          </p>
        </InfoCard>

        <InfoCard icon={"\uD83D\uDC65"} title="Our Team" isDark={isDark}>
          <p
            style={{
              color: isDark ? "#b0c4b1" : "#555",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              marginBottom: 16,
            }}
          >
            Founded by five university friends from different academic fields, bringing an
            interdisciplinary edge to sustainable food technology.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
              gap: 8,
            }}
          >
            <TeamMember name="Adrin" emoji={"\uD83D\uDC68\u200D\uD83D\uDCBB"} isDark={isDark} />
            <TeamMember name="Sanjay" emoji={"\uD83D\uDC68\u200D\uD83D\uDD2C"} isDark={isDark} />
            <TeamMember
              name="Karthikraj"
              emoji={"\uD83D\uDC68\u200D\uD83C\uDFA8"}
              isDark={isDark}
            />
            <TeamMember name="Shanthosh" emoji={"\uD83D\uDC68\u200D\uD83C\uDF93"} isDark={isDark} />
            <TeamMember name="Dheeraj" emoji={"\uD83D\uDC68\u200D\uD83D\uDCBC"} isDark={isDark} />
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
