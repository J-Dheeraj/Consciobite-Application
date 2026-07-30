"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { loginUser } from "@/services/api";
import PageHero from "@/components/PageHero";
import {
  pageContainer,
  card,
  primaryButton,
  inputField,
  errorAlert,
  formLabel,
} from "@/utils/pageStyles";

export default function Login() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.user, data.token, data.expiresAt);
      router.push("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"🔑"}
        title="Welcome Back"
        subtitle="Sign in to track your carbon footprint and leave reviews."
      />

      <div style={pageContainer(400)}>
        <form
          onSubmit={handleSubmit}
          style={{
            ...card(isDark),
            marginTop: -20,
            padding: 28,
            animation: "fadeInUp 0.4s ease",
          }}
        >
          {error && (
            <div
              id="login-error"
              role="alert"
              aria-live="assertive"
              style={{
                ...errorAlert(isDark),
                padding: 12,
                fontSize: "0.88rem",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={formLabel(isDark)}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-describedby={error ? "login-error" : undefined}
              placeholder="you@example.com"
              style={inputField(isDark, { radius: 10, fullWidth: true })}
            />
          </label>

          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={formLabel(isDark)}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              style={inputField(isDark, { radius: 10, fullWidth: true })}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...primaryButton({ loading, width: "100%" }),
              padding: "14px",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: "0.88rem",
              color: isDark ? "#7a9a7e" : "#888",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#52b788", fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
