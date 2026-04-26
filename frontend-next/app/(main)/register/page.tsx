"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { registerUser } from "@/services/api";
import PageHero from "@/components/PageHero";

interface RegisterResponse {
  user: { id: string; name: string; email: string };
  token: string;
}

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const data = (await registerUser(name, email, password)) as RegisterResponse;
      login(data.user, data.token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <PageHero
        icon="🌱"
        title="Join Consciobite"
        subtitle="Create an account to track your sustainability journey."
      />

      <div className="max-w-[400px] mx-auto px-6">
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl shadow-md -mt-5 p-7 animate-[fadeInUp_0.4s_ease]"
        >
          {error && (
            <div
              id="register-error"
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-lg border border-[#e63946] bg-[#fef2f2] p-3 text-sm text-[#c5303c] dark:bg-[#3a1a1f] dark:text-[#ff8a95]"
            >
              {error}
            </div>
          )}

          <label className="block mb-4">
            <span className="block text-sm font-medium text-ink mb-1.5">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-ink outline-none focus:border-brand-600"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium text-ink mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-ink outline-none focus:border-brand-600"
            />
          </label>

          <label className="block mb-5">
            <span className="block text-sm font-medium text-ink mb-1.5">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-ink outline-none focus:border-brand-600"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-800 px-3.5 py-3.5 font-bold text-white hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center mt-4 text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
