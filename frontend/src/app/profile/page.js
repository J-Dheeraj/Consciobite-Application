"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCurrentUser, updateProfile, changePassword } from "@/services/auth";
import { fetchCarbonSummary } from "@/services/api";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton } from "@/utils/pageStyles";

const fieldStyle = (isDark) => ({
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1.5px solid " + (isDark ? "#2d4a35" : "#cde8d8"),
  background: isDark ? "#0d2118" : "#f8fdfb",
  color: isDark ? "#e8f5e9" : "#1b2b22",
  fontSize: "0.95rem",
  outline: "none",
  boxSizing: "border-box",
});

const labelStyle = (isDark) => ({
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: isDark ? "#95d5b2" : "#2d6a4f",
  marginBottom: 6,
});

const alertStyle = (type, isDark) => ({
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 14,
  fontSize: "0.85rem",
  background: type === "error" ? (isDark ? "#2a1519" : "#fef2f2") : isDark ? "#0d2118" : "#edf7f0",
  color: type === "error" ? "#e63946" : isDark ? "#95d5b2" : "#2d6a4f",
  border:
    "1px solid " +
    (type === "error" ? (isDark ? "#4a1a1f" : "#fca5a5") : isDark ? "#1c3a2a" : "#b7e4c7"),
});

function StatPill({ label, value, isDark }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "16px 12px",
        background: isDark ? "#0d2118" : "#f0faf4",
        borderRadius: 10,
        flex: 1,
        minWidth: 80,
      }}
    >
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
      <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#666", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const qc = useQueryClient();

  const [nameValue, setNameValue] = useState("");
  const [nameMsg, setNameMsg] = useState(null);

  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState(null);

  const { data: meData, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
    onSuccess: (data) => {
      if (!nameValue) setNameValue(data.user?.name || "");
    },
  });

  const { data: carbonData } = useQuery({
    queryKey: ["carbon-summary"],
    queryFn: fetchCarbonSummary,
    enabled: isAuthenticated,
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      updateUser(data.user);
      qc.invalidateQueries({ queryKey: ["me"] });
      setNameMsg({ type: "success", text: "Display name updated." });
    },
    onError: (err) => {
      setNameMsg({ type: "error", text: err.message });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setPwdForm({ currentPassword: "", newPassword: "", confirm: "" });
    },
    onError: (err) => {
      setPwdMsg({ type: "error", text: err.message });
    },
  });

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (isLoading) return <Spinner message="Loading profile..." />;

  const profile = meData?.user || user;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const handleNameSubmit = (e) => {
    e.preventDefault();
    setNameMsg(null);
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }
    profileMutation.mutate({ name: trimmed });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwdForm.newPassword !== pwdForm.confirm) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    passwordMutation.mutate({
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword,
    });
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero icon="👤" title="My Profile" subtitle="Manage your account settings." />

      <div style={pageContainer(600)}>
        {/* Account Info */}
        <div style={{ ...card(isDark), padding: 24, marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: 16,
              color: isDark ? "#e8f5e9" : "inherit",
            }}
          >
            Account
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <span style={labelStyle(isDark)}>Email</span>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: isDark ? "#b0c4b1" : "#444",
                  padding: "8px 0",
                }}
              >
                {profile?.email}
              </div>
            </div>
            <div>
              <span style={labelStyle(isDark)}>Member Since</span>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: isDark ? "#b0c4b1" : "#444",
                  padding: "8px 0",
                }}
              >
                {memberSince}
              </div>
            </div>
          </div>

          {/* Carbon Stats */}
          {carbonData && (
            <div style={{ marginTop: 20 }}>
              <span style={labelStyle(isDark)}>Carbon Activity</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <StatPill
                  label="Total CO₂e (kg)"
                  value={(carbonData.totalEmissions ?? 0).toFixed(1)}
                  isDark={isDark}
                />
                <StatPill
                  label="This Month (kg)"
                  value={(carbonData.monthlyEmissions ?? 0).toFixed(1)}
                  isDark={isDark}
                />
                <StatPill label="Log Entries" value={carbonData.logCount ?? 0} isDark={isDark} />
              </div>
            </div>
          )}
        </div>

        {/* Update Name */}
        <div style={{ ...card(isDark), padding: 24, marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: 16,
              color: isDark ? "#e8f5e9" : "inherit",
            }}
          >
            Display Name
          </h2>
          <form onSubmit={handleNameSubmit}>
            {nameMsg && <div style={alertStyle(nameMsg.type, isDark)}>{nameMsg.text}</div>}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle(isDark)} htmlFor="display-name">
                Name
              </label>
              <input
                id="display-name"
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                maxLength={50}
                style={fieldStyle(isDark)}
                autoComplete="name"
              />
            </div>
            <button
              type="submit"
              disabled={profileMutation.isPending}
              style={{ ...primaryButton(), padding: "10px 24px" }}
            >
              {profileMutation.isPending ? "Saving…" : "Save Name"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div style={{ ...card(isDark), padding: 24, marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: 16,
              color: isDark ? "#e8f5e9" : "inherit",
            }}
          >
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit}>
            {pwdMsg && <div style={alertStyle(pwdMsg.type, isDark)}>{pwdMsg.text}</div>}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle(isDark)} htmlFor="current-password">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, currentPassword: e.target.value }))}
                style={fieldStyle(isDark)}
                autoComplete="current-password"
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle(isDark)} htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))}
                style={fieldStyle(isDark)}
                autoComplete="new-password"
              />
              <div
                style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 4 }}
              >
                Min 8 characters, with uppercase, lowercase, and a number.
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle(isDark)} htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
                style={fieldStyle(isDark)}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              style={{ ...primaryButton(), padding: "10px 24px" }}
            >
              {passwordMutation.isPending ? "Updating…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
