import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        background: "#2d6a4f",
        color: "#fff",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link to="/" style={{ color: "#fff", fontWeight: 700, fontSize: "1.3rem" }}>
        Consciobite
      </Link>
      <div style={{ display: "flex", gap: 20, fontSize: "0.9rem" }}>
        <Link to="/" style={{ color: "#cde4d5" }}>Products</Link>
        <Link to="/scan" style={{ color: "#cde4d5" }}>Scan</Link>
        <Link to="/about" style={{ color: "#cde4d5" }}>About</Link>
      </div>
    </nav>
  );
}
