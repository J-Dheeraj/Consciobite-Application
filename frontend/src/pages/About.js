import React from "react";

export default function About() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>About Consciobite</h1>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <p style={{ marginBottom: 16 }}>
          Consciobite is a non-profit initiative founded by five university friends — Adrin, Sanjay,
          Karthikraj, Shanthosh, and Dheeraj — each from a different academic field, bringing an
          interdisciplinary edge to sustainable food technology.
        </p>

        <h3 style={{ marginBottom: 8 }}>Our Mission</h3>
        <p style={{ marginBottom: 16 }}>
          We empower consumers to make informed, sustainable food choices by providing transparent
          environmental impact data through our proprietary GreenGrade scoring system.
        </p>

        <h3 style={{ marginBottom: 8 }}>How GreenGrade Works</h3>
        <p style={{ marginBottom: 16 }}>
          Our algorithm evaluates carbon emissions across seven categories of the food supply chain:
          Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, and Retail. Each
          product receives a score from 0 to 10, color-coded for quick visual assessment:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
          <li><strong style={{ color: "#2d6a4f" }}>Green (7-10)</strong> — Low environmental impact</li>
          <li><strong style={{ color: "#c59a1a" }}>Yellow (4-6.9)</strong> — Moderate impact</li>
          <li><strong style={{ color: "#e63946" }}>Red (0-3.9)</strong> — High impact</li>
        </ul>

        <h3 style={{ marginBottom: 8 }}>The Problem We Solve</h3>
        <p style={{ marginBottom: 16 }}>
          Nearly 45% of consumers are uninformed about the environmental practices of the brands
          they support. With Gen Z poised to become the dominant workforce by 2025, two-thirds of
          whom advocate for sustainable food production, the demand for transparency has never been
          greater.
        </p>

        <h3 style={{ marginBottom: 8 }}>Market Opportunity</h3>
        <p>
          The ethical labelling market is projected to grow at a CAGR of 6.51%, reaching a potential
          market value of USD 372.7 billion by 2026. Consciobite is positioned to be a key player
          in this space, inspired by organizations like the Global Recycled Standard and Organic
          Content Standard.
        </p>
      </div>
    </div>
  );
}
