"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCurrentUser, fetchCarbonSummary } from "@/services/api";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { card, pageContainer, primaryButton } from "@/utils/pageStyles";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatTile({ label, value, sub, isDark }) {
  return (
    <div
      style={{
        ...card(isDark, { padding: "20px 16px" }),
        textAlign: "center",
        flex: "1 1 120px",
      }}
    >
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.7rem",
          color: isDark ? "#95d5b2" : "#2d6a4f",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: isDark ? "#b0c4b1" : "#555" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const router = useRouter();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
  });

  const { data: carbonData } = useQuery({
    queryKey: ["profile-carbon"],
    queryFn: fetchCarbonSummary,
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!isAuthenticated) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <PageHero
          icon="👤"
          title="My Profile"
          subtitle="Manage your account and view your stats."
        />
        <div style={{ maxWidth: 460, margin: "0 auto", padding: "0 20px 40px" }}>
          <div
            style={{
              ...card(isDark, { padding: 32 }),
              marginTop: -20,
              textAlign: "center",
              animation: "fadeInUp 0.4s ease",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>🔒</div>
            <p style={{ color: isDark ? "#7a9a7e" : "#888", marginBottom: 20 }}>
              Sign in to view your profile and activity.
            </p>
            <Link
              href="/login"
              style={{ ...primaryButton(), display: "inline-block", textDecoration: "none" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return <Spinner message="Loading profile..." />;
  }

  const user = userData?.user || authUser;
  const summary = carbonData || null;
  const initial = (user?.name || "?")[0].toUpperCase();
  const totalEmissions = summary?.total?.totalEmissions ?? null;
  const totalLogs = summary?.total?.totalLogs ?? null;
  const weeklyEmissions = summary?.weekly?.emissions ?? null;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="👤"
        title="My Profile"
        subtitle="Your account overview and activity summary."
      />

      <div style={{ ...pageContainer(640), marginTop: -20 }}>
        {/* Profile card */}
        <div
          style={{
            ...card(isDark, { padding: 28 }),
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 16,
            animation: "fadeInUp 0.35s ease",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2d6a4f, #52b788)",
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "1.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.3rem",
                color: isDark ? "#e8f5e9" : "#1a2e1a",
                marginBottom: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name || "—"}
            </div>
            <div
              style={{
                fontSize: "0.88rem",
                color: isDark ? "#7a9a7e" : "#666",
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email || "—"}
            </div>
            {user?.created_at && (
              <div style={{ fontSize: "0.78rem", color: isDark ? "#5a7a5e" : "#aaa" }}>
                Member since {formatDate(user.created_at)}
              </div>
            )}
          </div>
        </div>

        {/* Carbon stats */}
        {summary && (
          <div style={{ marginBottom: 16, animation: "fadeInUp 0.35s ease 0.05s both" }}>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: isDark ? "#7a9a7e" : "#888",
                marginBottom: 10,
              }}
            >
              Carbon Activity
            </h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatTile
                label="Total Logged"
                value={totalLogs ?? 0}
                sub="purchases"
                isDark={isDark}
              />
              <StatTile
                label="Total Emissions"
                value={
                  totalEmissions !== null && totalEmissions !== undefined
                    ? `${totalEmissions.toFixed(1)}`
                    : "0"
                }
                sub="kg CO₂e"
                isDark={isDark}
              />
              <StatTile
                label="This Week"
                value={
                  weeklyEmissions !== null && weeklyEmissions !== undefined
                    ? `${weeklyEmissions.toFixed(1)}`
                    : "0"
                }
                sub="kg CO₂e"
                isDark={isDark}
              />
            </div>
          </div>
        )}

        {/* Quick links */}
        <div style={{ marginBottom: 20, animation: "fadeInUp 0.35s ease 0.1s both" }}>
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: isDark ? "#7a9a7e" : "#888",
              marginBottom: 10,
            }}
          >
            Quick Access
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                href: "/carbon",
                icon: "🌍",
                label: "Carbon Tracker",
                sub: "Log and track your food emissions",
              },
              {
                href: "/favorites",
                icon: "♥",
                label: "My Favorites",
                sub: "Products you've saved",
              },
              {
                href: "/products",
                icon: "🔍",
                label: "Browse Products",
                sub: "Explore 550+ scored products",
              },
              {
                href: "/transparency",
                icon: "🛡️",
                label: "Transparency Report",
                sub: "Governance & audit trail",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...card(isDark, { padding: "14px 18px" }),
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(45,106,79,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = card(isDark).boxShadow;
                }}
              >
                <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      color: isDark ? "#e8f5e9" : "#1a2e1a",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
                    {item.sub}
                  </div>
                </div>
                <span style={{ color: isDark ? "#5a7a5e" : "#ccc", fontSize: "1rem" }}>›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div style={{ animation: "fadeInUp 0.35s ease 0.15s both" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "13px 24px",
              background: "none",
              border: `1.5px solid ${isDark ? "#3a2020" : "#fecaca"}`,
              borderRadius: 12,
              color: "#e63946",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(231,57,70,0.08)" : "#fef2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
