"use client";
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      style={{
        background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #1b4332 100%)",
        color: "rgba(255,255,255,0.7)",
        padding: "40px 24px 24px",
        marginTop: 0,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 32,
            marginBottom: 32,
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: "1.3rem",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{"\uD83C\uDF3F"}</span> Consciobite
            </div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
              Empowering sustainable food choices through transparent environmental data and
              GreenGrade scoring.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4
              style={{
                color: "#95d5b2",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Explore
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { to: "/", label: "Products" },
                { to: "/scan", label: "Scan Barcode" },
                { to: "/compare", label: "Compare" },
                { to: "/dashboard", label: "Dashboard" },
                { to: "/tips", label: "Eco Tips" },
              ].map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4
              style={{
                color: "#95d5b2",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Resources
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { to: "/about", label: "About Us" },
                { to: "/favorites", label: "My Favorites" },
              ].map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Eco Fact */}
          <div>
            <h4
              style={{
                color: "#95d5b2",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Did You Know?
            </h4>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
              Food systems account for about 26% of global greenhouse gas emissions. Your choices
              matter!
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 20 }} />

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: "0.8rem" }}>
            {"\u00A9"} {new Date().getFullYear()} Consciobite. Built for a greener tomorrow.
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Carbon Neutral", color: "#52b788" },
              { label: "Open Data", color: "#74c69d" },
              { label: "Made in SG", color: "#95d5b2" },
            ].map((badge) => (
              <span
                key={badge.label}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.08)",
                  fontSize: "0.72rem",
                  color: badge.color,
                  fontWeight: 600,
                }}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
