import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { registerUser } from "../services/api";
import PageHero from "../components/PageHero";

export default function Register() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser(name, email, password);
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"🌱"}
        title="Join Consciobite"
        subtitle="Create an account to track your sustainability journey."
      />

      <div style={{ maxWidth: 400, margin: "0 auto", padding: "0 20px 40px" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: -20,
            background: isDark ? "#162419" : "#fff",
            borderRadius: 14,
            padding: 28,
            boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
            animation: "fadeInUp 0.4s ease",
          }}
        >
          {error && (
            <div
              style={{
                padding: 12,
                background: isDark ? "#2a1519" : "#fef2f2",
                borderRadius: 10,
                color: "#e63946",
                fontSize: "0.88rem",
                marginBottom: 16,
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <label style={{ display: "block", marginBottom: 16 }}>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: isDark ? "#b0c4b1" : "#555",
                marginBottom: 6,
                display: "block",
              }}
            >
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "2px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: isDark ? "#b0c4b1" : "#555",
                marginBottom: 6,
                display: "block",
              }}
            >
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "2px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 20 }}>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: isDark ? "#b0c4b1" : "#555",
                marginBottom: 6,
                display: "block",
              }}
            >
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "2px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#95d5b2" : "linear-gradient(135deg, #2d6a4f, #40916c)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(45,106,79,0.3)",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: "0.88rem",
              color: isDark ? "#7a9a7e" : "#888",
            }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#52b788", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
