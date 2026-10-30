"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { updateProfile } from "@/services/api";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import {
  pageContainer,
  card,
  primaryButton,
  inputField,
  formLabel,
  errorAlert,
} from "@/utils/pageStyles";
import { WEEKLY_CARBON_GOAL_KG } from "@/utils/constants";

function SectionCard({ title, children, isDark }) {
  return (
    <div
      style={{
        ...card(isDark),
        padding: 24,
        marginBottom: 20,
        animation: "fadeInUp 0.4s ease both",
      }}
    >
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          marginBottom: 18,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user, isAuthenticated, initializing, updateUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(WEEKLY_CARBON_GOAL_KG);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Wait for the cookie-based session restore before deciding to redirect,
    // otherwise a signed-in user landing here directly is bounced to /login.
    if (initializing) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user) {
      setName(user.name || "");
      setWeeklyGoal(user.weeklyGoal ?? WEEKLY_CARBON_GOAL_KG);
    }
  }, [user, isAuthenticated, initializing, router]);

  if (initializing) {
    return <Spinner message="Loading your profile..." />;
  }

  if (!isAuthenticated) {
    return <Spinner message="Redirecting..." />;
  }

  const textColor = isDark ? "#b0c4b1" : "#555";

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const data = await updateProfile({ name: name.trim(), weeklyGoal });
      updateUser(data.user);
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="👤"
        title="Your Profile"
        subtitle="Update your name and personal carbon goal."
      />

      <div style={pageContainer(560)}>
        <form onSubmit={handleSave}>
          {/* Account info */}
          <SectionCard title="Account" isDark={isDark}>
            <div style={{ marginBottom: 16 }}>
              <label style={formLabel(isDark)} htmlFor="profile-name">
                Display name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                style={{
                  ...inputField(isDark, { fullWidth: true }),
                  background: isDark ? "#1c2e22" : "#fff",
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                }}
              />
            </div>

            <div>
              <label style={{ ...formLabel(isDark), marginBottom: 2 }}>Email</label>
              <p style={{ fontSize: "0.9rem", color: textColor, margin: "4px 0 0" }}>
                {user?.email}
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: isDark ? "#4a6a4e" : "#aaa",
                  margin: "2px 0 0",
                }}
              >
                Email cannot be changed.
              </p>
            </div>
          </SectionCard>

          {/* Weekly carbon goal */}
          <SectionCard title="Weekly Carbon Goal" isDark={isDark}>
            <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.6, marginBottom: 16 }}>
              Set the weekly CO₂e target (in kg) for your food purchases. The carbon tracker uses
              this to show your progress each week.
            </p>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={formLabel(isDark)} htmlFor="goal-slider">
                  Target:{" "}
                  <strong style={{ color: isDark ? "#74c69d" : "#2d6a4f" }}>
                    {weeklyGoal} kg CO₂e / week
                  </strong>
                </label>
              </div>

              <input
                id="goal-slider"
                type="range"
                min={1}
                max={50}
                step={0.5}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#2d6a4f", cursor: "pointer" }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: isDark ? "#4a6a4e" : "#aaa",
                  marginTop: 4,
                }}
              >
                <span>1 kg</span>
                <span>50 kg</span>
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#f0fdf4",
                border: `1px solid ${isDark ? "#2d4a35" : "#bbf7d0"}`,
                fontSize: "0.82rem",
                color: textColor,
              }}
            >
              {weeklyGoal <= 7
                ? "Ambitious! Under 7 kg/week is consistent with a mostly plant-based diet."
                : weeklyGoal <= 14
                  ? "This is a reasonable starting goal for many households."
                  : weeklyGoal <= 25
                    ? "A good first step — you can lower it further as you discover eco alternatives."
                    : "Consider lowering this target to reduce your environmental impact."}
            </div>
          </SectionCard>

          {error && <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>{error}</div>}

          {success && (
            <div
              style={{
                color: "#16a34a",
                padding: 14,
                background: isDark ? "#14352a" : "#f0fdf4",
                borderRadius: 10,
                border: "1px solid #bbf7d0",
                marginBottom: 16,
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            style={{
              ...primaryButton({ loading: saving, width: "100%" }),
              fontSize: "1rem",
            }}
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>

        {/* Account stats */}
        <SectionCard title="Account Info" isDark={isDark}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              {
                label: "Member since",
                value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—",
              },
              { label: "Email", value: user?.email || "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
                }}
              >
                <span style={{ fontSize: 14, color: textColor }}>{label}</span>
                <span
                  style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#e8f5e9" : "#1a3a2a" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
