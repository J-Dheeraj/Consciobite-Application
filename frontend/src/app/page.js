"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchProducts } from "@/services/api";
import { scoreColor } from "@/utils/constants";

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const doSearch = (query) => {
    setLoading(true);
    fetchProducts({ search: query, limit: 8 })
      .then((data) => {
        setResults(data.products);
        setShowResults(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(val), 250);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && search.trim().length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(search);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults = showResults && results.length > 0;

  return (
    <div className="lp">
      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <span className="lp-eyebrow">Sustainability Scoring Platform</span>

          <h1 className="lp-h1">
            Know what you eat.
            <br />
            <em>Protect what matters.</em>
          </h1>

          <p className="lp-hero-sub">
            GreenGrade scores every product across 7 supply-chain dimensions — from land use to
            retail — so you can shop with confidence and cut your food carbon footprint.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => router.push("/products")}>
              Browse Products
            </button>
            <Link className="lp-btn-ghost" href="/about">
              How it works &rarr;
            </Link>
          </div>
        </div>

        {/* Grade Card Demo */}
        <div className="lp-grade-card">
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--lp-ink-muted)",
                marginBottom: 8,
              }}
            >
              Sample Product Score
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--lp-green-900)" }}>
              Organic Free-Range Eggs
            </div>
            <div style={{ fontSize: 13, color: "var(--lp-ink-light)", marginTop: 4 }}>
              FairPrice &middot; Dairy &amp; Eggs
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2d7a42, #5ab870)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "var(--lp-serif)",
                boxShadow: "0 4px 20px rgba(45, 122, 66, 0.3)",
              }}
            >
              7.8
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--lp-green-700)",
                  marginBottom: 2,
                }}
              >
                GreenGrade: Excellent
              </div>
              <div style={{ fontSize: 13, color: "var(--lp-ink-light)" }}>
                Top 15% of products in category
              </div>
            </div>
          </div>

          {/* Mini emissions breakdown */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {[
              { label: "Land Use", val: "0.8", pct: 80 },
              { label: "Farm", val: "1.2", pct: 60 },
              { label: "Transport", val: "0.3", pct: 90 },
              { label: "Packaging", val: "0.1", pct: 95 },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "var(--lp-green-50)",
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--lp-ink-muted)",
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--lp-green-900)",
                    }}
                  >
                    {item.val}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--lp-ink-light)" }}>kg CO₂e</span>
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 3,
                    background: "var(--lp-green-200)",
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${item.pct}%`,
                      borderRadius: 3,
                      background: "var(--lp-green-500)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="lp-stats-bar">
        <div className="lp-stats-inner">
          {[
            { num: "550+", label: "Products Scored" },
            { num: "7", label: "Supply-Chain Dimensions" },
            { num: "100%", label: "Transparent Methodology" },
            { num: "Free", label: "Open Access" },
          ].map((s) => (
            <div key={s.label}>
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Search */}
      <section className="lp-section" style={{ textAlign: "center" }}>
        <div className="lp-label" style={{ textAlign: "center" }}>
          Try it now
        </div>
        <h2 className="lp-title" style={{ textAlign: "center", margin: "0 auto 16px" }}>
          Search any product
        </h2>
        <p className="lp-sub" style={{ textAlign: "center", margin: "0 auto 40px" }}>
          Look up any food product and get its GreenGrade sustainability score instantly.
        </p>

        <div
          ref={searchRef}
          role="combobox"
          aria-expanded={hasResults}
          aria-controls="search-results"
          aria-haspopup="listbox"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          <input
            type="text"
            placeholder="Search for a product..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            aria-label="Search products"
            aria-autocomplete="list"
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: hasResults ? "14px 14px 0 0" : 14,
              border: "1.5px solid var(--lp-border)",
              fontSize: 15,
              background: "white",
              color: "var(--lp-ink)",
              outline: "none",
              fontWeight: 500,
              fontFamily: "var(--lp-sans)",
              transition: "border-radius 0.15s ease",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          />
          {loading && (
            <span
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--lp-ink-muted)",
                fontSize: 13,
              }}
            >
              Searching...
            </span>
          )}

          {hasResults && (
            <div
              id="search-results"
              role="listbox"
              style={{
                background: "white",
                borderRadius: "0 0 14px 14px",
                padding: "4px 0",
                boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                border: "1.5px solid var(--lp-border)",
                borderTop: "none",
                position: "absolute",
                width: "100%",
                zIndex: 10,
              }}
            >
              {results.map((p) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    setShowResults(false);
                    router.push(`/product/${p.id}`);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--lp-ink)",
                    transition: "background 0.12s",
                    gap: 12,
                    fontFamily: "var(--lp-sans)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--lp-green-50)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      textAlign: "left",
                      flex: 1,
                    }}
                  >
                    {p.brand} {p.name}
                  </span>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: scoreColor(p.greenGrade.score),
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {p.greenGrade.score}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ICP Section */}
      <section className="lp-icp-section">
        <div className="lp-icp-inner">
          <div className="lp-label">Who it&rsquo;s for</div>
          <h2 className="lp-title">Built for conscious consumers</h2>
          <p className="lp-sub">
            Whether you&rsquo;re shopping for your family, running a restaurant, or managing
            procurement — GreenGrade gives you the data you need.
          </p>

          <div className="lp-icp-grid">
            <div className="lp-icp-card">
              <span className="lp-icp-tag">Individuals</span>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "var(--lp-green-900)",
                }}
              >
                Eco-Conscious Shoppers
              </h3>
              <p style={{ fontSize: 14, color: "var(--lp-ink-light)", marginBottom: 16 }}>
                Compare products at the shelf. Scan barcodes, check scores, and pick the greener
                option every time.
              </p>
              <p className="lp-icp-pain">
                &ldquo;I want to buy sustainable but I can&rsquo;t tell which products are actually
                better.&rdquo;
              </p>
            </div>

            <div className="lp-icp-card">
              <span className="lp-icp-tag">Families</span>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "var(--lp-green-900)",
                }}
              >
                Health-Minded Parents
              </h3>
              <p style={{ fontSize: 14, color: "var(--lp-ink-light)", marginBottom: 16 }}>
                Track your household&rsquo;s food carbon footprint, set weekly goals, and discover
                eco-friendly recipes.
              </p>
              <p className="lp-icp-pain">
                &ldquo;I want my kids to grow up eating food that&rsquo;s good for them and the
                planet.&rdquo;
              </p>
            </div>

            <div className="lp-icp-card">
              <span className="lp-icp-tag">Organizations</span>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "var(--lp-green-900)",
                }}
              >
                Corporate Procurement
              </h3>
              <p style={{ fontSize: 14, color: "var(--lp-ink-light)", marginBottom: 16 }}>
                Make data-driven purchasing decisions aligned with ESG goals. Score your full
                product portfolio and get Digital Product Passports for Scope 3 reporting.
              </p>
              <p className="lp-icp-pain">
                &ldquo;We need transparent supply-chain data for our sustainability
                reporting.&rdquo;
              </p>
              <Link
                href="/portfolio"
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--lp-green-700)",
                  textDecoration: "none",
                }}
              >
                Score your portfolio &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="lp-section">
        <div className="lp-label">Why GreenGrade</div>
        <h2 className="lp-title">Not just another eco-label</h2>
        <p className="lp-sub">
          GreenGrade uses machine learning on real emissions data — not self-reported claims — to
          score every product transparently.
        </p>

        <div className="lp-vp-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {[
              {
                icon: "\u{1F50D}",
                title: "7-Dimension Analysis",
                desc: "Every score covers Land Use, Animal Feed, Farm, Processing, Transport, Packaging, and Retail emissions.",
              },
              {
                icon: "\u{1F4CA}",
                title: "Statistical ML Scoring",
                desc: "Gaussian KDE and variance-based feature importance — no black-box models, fully auditable methodology.",
              },
              {
                icon: "\u{1F50E}",
                title: "Barcode Scanning",
                desc: "Scan any product at the grocery store and get its GreenGrade score in seconds.",
              },
              {
                icon: "\u{2696}\u{FE0F}",
                title: "Side-by-Side Comparisons",
                desc: "Compare any two products across all 7 dimensions and see exactly where each one is greener.",
              },
              {
                icon: "\u{1F30D}",
                title: "Carbon Footprint Tracking",
                desc: "Log your purchases and track your personal food emissions over time with weekly reduction goals.",
              },
            ].map((vp) => (
              <div className="lp-vp-point" key={vp.title}>
                <div className="lp-vp-icon">{vp.icon}</div>
                <div>
                  <h4
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--lp-green-900)",
                      marginBottom: 4,
                    }}
                  >
                    {vp.title}
                  </h4>
                  <p style={{ fontSize: 14, color: "var(--lp-ink-light)", margin: 0 }}>{vp.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lp-vp-quote">
            <div
              style={{
                fontFamily: "var(--lp-serif)",
                fontSize: 22,
                fontStyle: "italic",
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              &ldquo;Every food choice is a vote for the kind of world you want to live in.&rdquo;
            </div>
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 32 }}>
              &mdash; Our guiding principle
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--lp-serif)",
                  fontSize: 36,
                  color: "var(--lp-green-400)",
                  letterSpacing: -1,
                }}
              >
                550+
              </div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>Products scored and counting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="lp-section">
        <div className="lp-label" style={{ textAlign: "center" }}>
          Compare
        </div>
        <h2 className="lp-title" style={{ textAlign: "center", margin: "0 auto 16px" }}>
          How we stack up
        </h2>
        <p className="lp-sub" style={{ textAlign: "center", margin: "0 auto 0" }}>
          Most eco-labels rely on self-reported data. GreenGrade uses verified emissions data and
          machine learning.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table className="lp-comp-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="lp-comp-head-us">GreenGrade</th>
                <th>Generic Eco-Labels</th>
                <th>Manual Research</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["7-dimension emissions scoring", true, false, false],
                ["Machine learning methodology", true, false, false],
                ["Barcode scanning", true, false, false],
                ["Product comparison tool", true, false, true],
                ["Portfolio scoring (up to 100 SKUs)", true, false, false],
                ["Digital Product Passport (DPP)", true, false, false],
                ["Carbon footprint tracking", true, false, false],
                ["Free and open access", true, true, true],
                ["Recipe suggestions", true, false, false],
              ].map(([feature, us, eco, manual], i) => (
                <tr key={i}>
                  <td>{feature}</td>
                  <td className="lp-comp-us">{us ? "✅" : "—"}</td>
                  <td>{eco ? "✅" : "—"}</td>
                  <td>{manual ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Guarantee */}
      <section className="lp-guarantee">
        <div className="lp-guarantee-inner">
          <div className="lp-guarantee-grid">
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--lp-green-400)",
                  marginBottom: 16,
                }}
              >
                Our Promise
              </div>
              <h2
                style={{
                  fontFamily: "var(--lp-serif)",
                  fontSize: "clamp(28px, 3vw, 40px)",
                  color: "var(--lp-cream)",
                  lineHeight: 1.2,
                  marginBottom: 40,
                }}
              >
                Built on transparency,
                <br />
                backed by science
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {[
                  {
                    icon: "\u{1F52C}",
                    title: "Open Methodology",
                    desc: "Our scoring algorithm is fully documented and auditable. No black boxes.",
                  },
                  {
                    icon: "\u{1F6E1}\u{FE0F}",
                    title: "Independent Scoring",
                    desc: "Listing fees are non-contingent on score outcome. An independent advisory panel audits our methodology.",
                  },
                  {
                    icon: "\u{1F4D6}",
                    title: "Data Provenance",
                    desc: "Every score links back to peer-reviewed emissions research with full citations.",
                  },
                  {
                    icon: "\u{1F310}",
                    title: "Free Forever",
                    desc: "GreenGrade is a non-profit initiative. Product scoring will always be free for consumers.",
                  },
                ].map((g) => (
                  <div key={g.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div className="lp-guarantee-icon">{g.icon}</div>
                    <div>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--lp-cream)",
                          marginBottom: 4,
                        }}
                      >
                        {g.title}
                      </h4>
                      <p style={{ fontSize: 13, color: "rgba(250,247,242,0.55)", margin: 0 }}>
                        {g.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 20,
                padding: 40,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--lp-serif)",
                  fontSize: 28,
                  color: "var(--lp-cream)",
                  marginBottom: 24,
                }}
              >
                How GreenGrade Works
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { step: "01", text: "Emissions data collected across 7 supply-chain categories" },
                  { step: "02", text: "Statistical normalization using Gaussian KDE" },
                  { step: "03", text: "Variance-based feature importance weighting" },
                  { step: "04", text: "Sigmoid scoring mapped to 0-10 scale" },
                  { step: "05", text: "Anomaly detection via Mahalanobis distance" },
                ].map((s) => (
                  <div key={s.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div
                      style={{
                        fontFamily: "var(--lp-serif)",
                        fontSize: 24,
                        color: "var(--lp-green-400)",
                        lineHeight: 1,
                        minWidth: 32,
                      }}
                    >
                      {s.step}
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(250,247,242,0.7)", margin: 0 }}>
                      {s.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-final-cta">
        <div className="lp-label" style={{ textAlign: "center" }}>
          Get Started
        </div>
        <h2
          className="lp-title"
          style={{ textAlign: "center", margin: "0 auto 16px", maxWidth: 600 }}
        >
          Start making smarter food choices today
        </h2>
        <p className="lp-sub" style={{ textAlign: "center", margin: "0 auto 40px" }}>
          Browse 550+ products, scan barcodes at the store, track your carbon footprint, and
          discover greener alternatives — all for free.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="lp-btn-primary" onClick={() => router.push("/products")}>
            Browse Products
          </button>
          <button
            className="lp-btn-primary"
            onClick={() => router.push("/scan")}
            style={{ background: "var(--lp-green-600)" }}
          >
            Scan a Barcode
          </button>
          <Link className="lp-btn-ghost" href="/dashboard">
            View Dashboard &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        &copy; {new Date().getFullYear()} Consciobite. Built for a sustainable future.
      </footer>
    </div>
  );
}
