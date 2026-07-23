"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCurrentUser, fetchUserStats, updateProfile, changePassword } from "@/services/api";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";
import {
  pageContainer,
  card,
  primaryButton,
  inputField,
  errorAlert,
  formLabel,
  heading,
} from "@/utils/pageStyles";

function StatTile({ label, value, unit, isDark }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "18px 12px",
        background: isDark ? "#1a3a2a" : "#f0faf4",
        borderRadius: 12,
        flex: 1,
      }}
    >
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: isDark ? "#74c69d" : "#2d6a4f" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#666", marginTop: 4 }}>
        {label}
      </div>
      {unit && (
        <div style={{ fontSize: "0.7rem", color: isDark ? "#52b788" : "#40916c", marginTop: 2 }}>
          {unit}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, user: ctxUser, login } = useAuth();
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["userStats"],
    queryFn: fetchUserStats,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <PageHero
          icon="👤"
          title="My Profile"
          subtitle="Sign in to view and manage your account."
        />
        <div style={{ ...pageContainer(400), textAlign: "center", paddingTop: 24 }}>
          <p style={{ color: isDark ? "#b0c4b1" : "#555", marginBottom: 20 }}>
            You need to be signed in to view your profile.
          </p>
          <Link
            href="/login"
            style={{ ...primaryButton(), textDecoration: "none", display: "inline-block" }}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (meLoading) return <Spinner message="Loading profile..." />;

  const user = meData?.user || ctxUser;

  const handleNameSave = async (e) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");
    setNameLoading(true);
    try {
      const data = await updateProfile(nameValue.trim());
      queryClient.setQueryData(["me"], data);
      login({ ...ctxUser, name: data.user.name }, localStorage.getItem("consciobite_token"));
      setEditingName(false);
      setNameSuccess("Name updated.");
    } catch (err) {
      setNameError(err.message || "Failed to update name.");
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");
    setPwdLoading(true);
    try {
      await changePassword(currentPwd, newPwd);
      setCurrentPwd("");
      setNewPwd("");
      setPwdSuccess("Password updated successfully.");
    } catch (err) {
      setPwdError(err.message || "Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const sectionGap = { marginBottom: 24 };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="👤"
        title="My Profile"
        subtitle="Manage your account and view your activity."
      />

      <div style={pageContainer(560)}>
        {/* Account Info Card */}
        <div style={{ ...card(isDark, { padding: 28 }), ...sectionGap }}>
          <h2
            style={{
              ...heading("1.1rem"),
              color: isDark ? "#e8f5e9" : "#1b4332",
              marginBottom: 20,
            }}
          >
            Account Details
          </h2>

          {!editingName ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ ...formLabel(isDark) }}>Display Name</div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: isDark ? "#e8f5e9" : "#1b4332",
                  }}
                >
                  {user?.name}
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingName(true);
                  setNameValue(user?.name || "");
                  setNameError("");
                  setNameSuccess("");
                }}
                style={{
                  background: "none",
                  border: `1px solid ${isDark ? "#2d4a35" : "#ccc"}`,
                  borderRadius: 8,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: isDark ? "#74c69d" : "#2d6a4f",
                }}
              >
                Edit
              </button>
            </div>
          ) : (
            <form onSubmit={handleNameSave} style={{ marginBottom: 16 }}>
              <label style={formLabel(isDark)}>Display Name</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={50}
                  style={{
                    ...inputField(isDark),
                    flex: 1,
                    background: isDark ? "#0d2318" : "#fafafa",
                    color: isDark ? "#e8f5e9" : "inherit",
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={nameLoading}
                  style={{ ...primaryButton({ loading: nameLoading }), padding: "10px 16px" }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setNameError("");
                  }}
                  style={{
                    background: "none",
                    border: `1px solid ${isDark ? "#2d4a35" : "#ccc"}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    cursor: "pointer",
                    color: isDark ? "#74c69d" : "#555",
                  }}
                >
                  Cancel
                </button>
              </div>
              {nameError && (
                <div style={{ ...errorAlert(isDark), marginTop: 8, padding: "8px 12px" }}>
                  {nameError}
                </div>
              )}
            </form>
          )}

          {nameSuccess && (
            <div
              style={{
                color: "#2d6a4f",
                background: isDark ? "#0d2318" : "#f0faf4",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: "0.85rem",
                marginBottom: 12,
              }}
            >
              {nameSuccess}
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={formLabel(isDark)}>Email</div>
              <div style={{ fontSize: "0.95rem", color: isDark ? "#b0c4b1" : "#444" }}>
                {user?.email}
              </div>
            </div>
            {joinDate && (
              <div>
                <div style={formLabel(isDark)}>Member Since</div>
                <div style={{ fontSize: "0.95rem", color: isDark ? "#b0c4b1" : "#444" }}>
                  {joinDate}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Stats */}
        <div style={{ ...card(isDark, { padding: 28 }), ...sectionGap }}>
          <h2
            style={{
              ...heading("1.1rem"),
              color: isDark ? "#e8f5e9" : "#1b4332",
              marginBottom: 20,
            }}
          >
            Your Activity
          </h2>
          {statsLoading ? (
            <div style={{ textAlign: "center", padding: 20, color: isDark ? "#7a9a7e" : "#888" }}>
              Loading stats…
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <StatTile
                label="Reviews Written"
                value={statsData?.reviews_count ?? 0}
                isDark={isDark}
              />
              <StatTile
                label="Carbon Entries"
                value={statsData?.carbon_entries ?? 0}
                isDark={isDark}
              />
              <StatTile
                label="Total CO₂e Logged"
                value={statsData?.total_co2e_kg ?? 0}
                unit="kg"
                isDark={isDark}
              />
            </div>
          )}
        </div>

        {/* Change Password */}
        <div style={{ ...card(isDark, { padding: 28 }), ...sectionGap }}>
          <h2
            style={{
              ...heading("1.1rem"),
              color: isDark ? "#e8f5e9" : "#1b4332",
              marginBottom: 20,
            }}
          >
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="currentPwd" style={formLabel(isDark)}>
                Current Password
              </label>
              <input
                id="currentPwd"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                style={{
                  ...inputField(isDark, { fullWidth: true }),
                  background: isDark ? "#0d2318" : "#fafafa",
                  color: isDark ? "#e8f5e9" : "inherit",
                }}
              />
            </div>
            <div>
              <label htmlFor="newPwd" style={formLabel(isDark)}>
                New Password
              </label>
              <input
                id="newPwd"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={8}
                style={{
                  ...inputField(isDark, { fullWidth: true }),
                  background: isDark ? "#0d2318" : "#fafafa",
                  color: isDark ? "#e8f5e9" : "inherit",
                }}
              />
              <div
                style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 4 }}
              >
                Min 8 chars, with uppercase, lowercase, and a number.
              </div>
            </div>
            {pwdError && <div style={errorAlert(isDark)}>{pwdError}</div>}
            {pwdSuccess && (
              <div
                style={{
                  color: "#2d6a4f",
                  background: isDark ? "#0d2318" : "#f0faf4",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: "0.85rem",
                }}
              >
                {pwdSuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={pwdLoading}
              style={{ ...primaryButton({ loading: pwdLoading }), alignSelf: "flex-start" }}
            >
              {pwdLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
