"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { registerUser } from "@/services/api";
import PageHero from "@/components/PageHero";
import {
  pageContainer,
  card,
  primaryButton,
  inputField,
  errorAlert,
  formLabel,
} from "@/utils/pageStyles";

export default function Register() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number");
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser(name.trim(), email.trim(), password);
      login(data.user, data.token);
      router.push("/");
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
              id="register-error"
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
            <span style={formLabel(isDark)}>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
              style={inputField(isDark, { radius: 10, fullWidth: true })}
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={formLabel(isDark)}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
            <Link href="/login" style={{ color: "#52b788", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
