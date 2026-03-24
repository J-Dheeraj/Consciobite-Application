import React from "react";
import PropTypes from "prop-types";

export default function Spinner({ message = "Loading..." }) {
  return (
    <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #d8f3dc",
          borderTopColor: "#2d6a4f",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }}
      />
      {message}
    </div>
  );
}

Spinner.propTypes = {
  message: PropTypes.string,
};
