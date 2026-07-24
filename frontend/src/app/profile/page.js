"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCurrentUser, fetchCarbonSummary } from "@/services/api";
import { getFavoriteIds } from "@/utils/favorites";
import { WEEKLY_CARBON_GOAL_KG } from "@/utils/constants";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";
import { pageContainer, card, heading } from "@/utils/pageStyles";

function InfoRow({ label, value, isDark }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: `1px solid ${isDark ? "#2d4a35" : "#f0f0f0"}`,
      }}
    >
      <span style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#888", fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: "0.95rem", color: isDark ? "#e8f5e9" : "#222", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function StatTile({ icon, value, label, isDark }) {
  return (
    <div
      style={{
        ...card(isDark, { padding: "18px 14px" }),
        textAlign: "center",
        flex: 1,
        minWidth: 100,
      }}
    >
      <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.5rem",
          color: isDark ? "#95d5b2" : "#2d6a4f",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, isDark }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 10,
        background: isDark ? "#1c3a2a" : "#f0faf4",
        color: isDark ? "#95d5b2" : "#2d6a4f",
        fontWeight: 600,
        fontSize: "0.9rem",
        textDecoration: "none",
        transition: "background 0.15s",
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      {label}
    </Link>
  );
}

export default function Profile() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated } = useAuth();
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    setFavCount(getFavoriteIds().length);
    const onUpdate = () => setFavCount(getFavoriteIds().length);
    window.addEventListener("favorites-updated", onUpdate);
    return () => window.removeEventListener("favorites-updated", onUpdate);
  }, []);

  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      Promise.all([fetchCurrentUser(), fetchCarbonSummary()]).then(([meData, carbonData]) => ({
        user: meData.user,
        carbon: carbonData,
      })),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <PageHero icon={"👤"} title="My Profile" subtitle="View your account and eco stats." />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
          <div
            style={{
              ...card(isDark, { padding: 28 }),
              marginTop: -20,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔒</div>
            <h2
              style={{ ...heading("1.1rem"), color: isDark ? "#e8f5e9" : "#222", marginBottom: 8 }}
            >
              Sign in to view your profile
            </h2>
            <p
              style={{ fontSize: "0.88rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 20 }}
            >
              Track your carbon footprint, saved products, and account details in one place.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/login"
                style={{
                  padding: "10px 22px",
                  background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                  color: "#fff",
                  borderRadius: 10,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                style={{
                  padding: "10px 22px",
                  background: isDark ? "#1c3a2a" : "#f0faf4",
                  color: isDark ? "#95d5b2" : "#2d6a4f",
                  borderRadius: 10,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Spinner message="Loading profile..." />;
  }

  if (error) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <PageHero icon={"👤"} title="My Profile" subtitle="View your account and eco stats." />
        <div style={pageContainer(600)}>
          <div
            style={{
              padding: 20,
              background: isDark ? "#2a1519" : "#fef2f2",
              borderRadius: 12,
              color: "#e63946",
              textAlign: "center",
            }}
          >
            {error.message || "Unable to load profile."}
          </div>
        </div>
      </div>
    );
  }

  const { user, carbon } = profileData;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const totalEmissions = carbon?.total?.emissions ?? 0;
  const weeklyEmissions = carbon?.weekly?.emissions ?? 0;
  const totalLogs = carbon?.total?.logs ?? 0;
  const weeklyProgress = Math.min(100, Math.round((weeklyEmissions / WEEKLY_CARBON_GOAL_KG) * 100));
  const progressColor =
    weeklyProgress < 60 ? "#2d6a4f" : weeklyProgress < 90 ? "#e9c46a" : "#e63946";

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"👤"}
        title={user?.name || "My Profile"}
        subtitle={`Member since ${memberSince}`}
      />

      <div style={{ ...pageContainer(640), marginTop: -20 }}>
        {/* Account info */}
        <div style={{ ...card(isDark, { padding: "8px 20px 4px" }), marginBottom: 16 }}>
          <h2
            style={{
              ...heading("1rem"),
              color: isDark ? "#95d5b2" : "#2d6a4f",
              padding: "14px 0 8px",
              borderBottom: `2px solid ${isDark ? "#2d4a35" : "#edf7f0"}`,
              marginBottom: 0,
            }}
          >
            Account Details
          </h2>
          <InfoRow label="Name" value={user?.name || "—"} isDark={isDark} />
          <InfoRow label="Email" value={user?.email || "—"} isDark={isDark} />
          <InfoRow label="Member since" value={memberSince} isDark={isDark} />
          <div style={{ paddingBottom: 4 }} />
        </div>

        {/* Carbon stats */}
        <div style={{ ...card(isDark, { padding: "16px 20px" }), marginBottom: 16 }}>
          <h2
            style={{
              ...heading("1rem"),
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginBottom: 14,
              paddingBottom: 8,
              borderBottom: `2px solid ${isDark ? "#2d4a35" : "#edf7f0"}`,
            }}
          >
            Carbon Footprint
          </h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <StatTile
              icon="🌍"
              value={`${totalEmissions.toFixed(1)}`}
              label="kg CO₂e total"
              isDark={isDark}
            />
            <StatTile
              icon="📅"
              value={`${weeklyEmissions.toFixed(1)}`}
              label="kg CO₂e this week"
              isDark={isDark}
            />
            <StatTile icon="📋" value={totalLogs} label="purchases logged" isDark={isDark} />
          </div>

          {/* Weekly progress bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                color: isDark ? "#7a9a7e" : "#888",
                marginBottom: 6,
              }}
            >
              <span>Weekly goal progress</span>
              <span>
                {weeklyEmissions.toFixed(1)} / {WEEKLY_CARBON_GOAL_KG} kg CO₂e
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 8,
                background: isDark ? "#2d4a35" : "#e8f5e9",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${weeklyProgress}%`,
                  borderRadius: 8,
                  background: progressColor,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: isDark ? "#7a9a7e" : "#888",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {weeklyProgress}% of weekly {WEEKLY_CARBON_GOAL_KG} kg goal
            </div>
          </div>
        </div>

        {/* Favorites */}
        <div style={{ ...card(isDark, { padding: "16px 20px" }), marginBottom: 16 }}>
          <h2
            style={{
              ...heading("1rem"),
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginBottom: 14,
              paddingBottom: 8,
              borderBottom: `2px solid ${isDark ? "#2d4a35" : "#edf7f0"}`,
            }}
          >
            Saved Products
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: "2.4rem",
                color: isDark ? "#95d5b2" : "#2d6a4f",
                lineHeight: 1,
              }}
            >
              {favCount}
            </div>
            <div>
              <div
                style={{ fontSize: "0.9rem", fontWeight: 600, color: isDark ? "#e8f5e9" : "#333" }}
              >
                {favCount === 1 ? "product" : "products"} saved
              </div>
              <Link
                href="/favorites"
                style={{
                  fontSize: "0.82rem",
                  color: isDark ? "#74c69d" : "#2d6a4f",
                  textDecoration: "underline",
                }}
              >
                View favorites →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ ...card(isDark, { padding: "16px 20px" }), marginBottom: 16 }}>
          <h2
            style={{
              ...heading("1rem"),
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: `2px solid ${isDark ? "#2d4a35" : "#edf7f0"}`,
            }}
          >
            Quick Links
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <QuickLink href="/carbon" icon="🌍" label="Carbon Tracker" isDark={isDark} />
            <QuickLink href="/favorites" icon="♥" label="My Favorites" isDark={isDark} />
            <QuickLink href="/products" icon="🛒" label="Browse Products" isDark={isDark} />
            <QuickLink href="/scan" icon="📷" label="Scan Barcode" isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}
