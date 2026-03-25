import React from "react";
import PropTypes from "prop-types";

export default function PageHero({ icon, title, subtitle, children }) {
  return (
    <div
      style={{
        background: "#0d2818",
        padding: "36px 24px 44px",
        textAlign: "center",
      }}
    >
      {icon && <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>{icon}</div>}
      <h1
        style={{
          color: "#fff",
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.6rem",
          marginBottom: 6,
        }}
      >
        {title}
      </h1>
      {subtitle && <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

PageHero.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
};
