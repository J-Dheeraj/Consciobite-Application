import React from "react";
import { captureError } from "../services/sentry";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ padding: 48, textAlign: "center", animation: "fadeIn 0.3s ease" }}
          role="alert"
        >
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.6 }}>{"\u26A0\uFE0F"}</div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                marginBottom: 8,
                color: "#1a1a2e",
              }}
            >
              Something went wrong
            </h2>
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 20, lineHeight: 1.6 }}>
              An unexpected error occurred. Please try again.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: "12px 28px",
                  background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  boxShadow: "0 2px 8px rgba(45,106,79,0.3)",
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 28px",
                  background: "transparent",
                  color: "#2d6a4f",
                  border: "2px solid #2d6a4f",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
