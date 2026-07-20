"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCurrentUser, updateProfile } from "@/services/api";
import { getFavoriteIds } from "@/utils/favorites";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";

const card = (isDark) => ({
  background: isDark ? "#162419" : "#fff",
  borderRadius: 14,
  padding: 24,
  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.06)",
  marginBottom: 16,
});

const label = (isDark) => ({
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: isDark ? "#74c69d" : "#2d6a4f",
  marginBottom: 4,
});

const inputStyle = (isDark) => ({
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${isDark ? "#2d4a35" : "#d8f3dc"}`,
  borderRadius: 10,
  background: isDark ? "#0e1f16" : "#f8fdf9",
  color: isDark ? "#e8f5e9" : "#1a3a2a",
  fontSize: "0.95rem",
  outline: "none",
  boxSizing: "border-box",
});

const statChip = (isDark) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: isDark ? "#1c2e22" : "#f0faf3",
  borderRadius: 10,
  padding: "10px 16px",
  fontSize: "0.88rem",
  color: isDark ? "#b7e4c7" : "#2d6a4f",
});

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Profile() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, user: authUser, token, login } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    setFavCount(getFavoriteIds().length);
    const update = () => setFavCount(getFavoriteIds().length);
    window.addEventListener("favorites-updated", update);
    return () => window.removeEventListener("favorites-updated", update);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
  });

  const user = data?.user;

  function startEdit() {
    setEditName(user?.name || "");
    setEditGoal(String(user?.carbon_goal_kg ?? 10));
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
  }

  async function handleSave() {
    const goalNum = Number(editGoal);
    if (!editName.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (!Number.isFinite(goalNum) || goalNum <= 0 || goalNum > 1000) {
      setError("Carbon goal must be between 0.1 and 1000 kg.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await updateProfile({ name: editName.trim(), carbon_goal_kg: goalNum });
      queryClient.setQueryData(["profile"], result);
      queryClient.invalidateQueries({ queryKey: ["carbon"] });
      login({ id: result.user.id, email: result.user.email, name: result.user.name }, token);
      setSuccess("Profile saved.");
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
    }
    setSaving(false);
  }

  if (!isAuthenticated) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <PageHero icon="👤" title="My Profile" subtitle="Manage your account and preferences." />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
          <div
            style={{
              ...card(isDark),
              textAlign: "center",
              marginTop: -20,
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>🔒</div>
            <p style={{ color: isDark ? "#7a9a7e" : "#888", marginBottom: 20 }}>
              Sign in to view and edit your profile.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                color: "#fff",
                borderRadius: 12,
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.95rem",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero icon="👤" title="My Profile" subtitle="Manage your account and carbon goal." />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px 40px" }}>
        {isLoading ? (
          <Spinner message="Loading profile..." />
        ) : (
          <>
            {/* Account info card */}
            <div style={card(isDark)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    margin: 0,
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                  }}
                >
                  Account
                </h2>
                {!editing && (
                  <button
                    onClick={startEdit}
                    style={{
                      background: "none",
                      border: `1px solid ${isDark ? "#2d4a35" : "#b7e4c7"}`,
                      borderRadius: 8,
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: isDark ? "#74c69d" : "#2d6a4f",
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <span style={label(isDark)}>Display Name</span>
                    <input
                      style={inputStyle(isDark)}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={50}
                      aria-label="Display name"
                    />
                  </div>

                  <div>
                    <span style={label(isDark)}>Weekly Carbon Goal (kg CO₂e)</span>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      step={0.5}
                      value={Math.min(Number(editGoal) || 10, 50)}
                      onChange={(e) => setEditGoal(e.target.value)}
                      style={{ width: "100%", accentColor: "#40916c", marginBottom: 8 }}
                      aria-label="Carbon goal slider"
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        min={0.1}
                        max={1000}
                        step={0.5}
                        value={editGoal}
                        onChange={(e) => setEditGoal(e.target.value)}
                        style={{ ...inputStyle(isDark), width: 100 }}
                        aria-label="Carbon goal kg"
                      />
                      <span style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888" }}>
                        kg CO₂e / week
                      </span>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" style={{ color: "#e63946", fontSize: "0.85rem", margin: 0 }}>
                      {error}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: "11px 0",
                        background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: "0.92rem",
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      style={{
                        padding: "11px 20px",
                        background: "none",
                        border: `1px solid ${isDark ? "#2d4a35" : "#d8f3dc"}`,
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: "0.92rem",
                        cursor: "pointer",
                        color: isDark ? "#7a9a7e" : "#888",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {success && (
                    <p role="status" style={{ color: "#27ae60", fontSize: "0.85rem", margin: 0 }}>
                      ✓ {success}
                    </p>
                  )}

                  <div>
                    <span style={label(isDark)}>Name</span>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: isDark ? "#e8f5e9" : "#1a3a2a",
                      }}
                    >
                      {user?.name || authUser?.name || "—"}
                    </p>
                  </div>

                  <div>
                    <span style={label(isDark)}>Email</span>
                    <p
                      style={{
                        margin: 0,
                        color: isDark ? "#b7e4c7" : "#2d6a4f",
                        wordBreak: "break-all",
                      }}
                    >
                      {user?.email || authUser?.email || "—"}
                    </p>
                  </div>

                  <div>
                    <span style={label(isDark)}>Member Since</span>
                    <p style={{ margin: 0, color: isDark ? "#7a9a7e" : "#888" }}>
                      {formatDate(user?.created_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Carbon goal summary card */}
            {!editing && (
              <div style={card(isDark)}>
                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    marginTop: 0,
                    marginBottom: 16,
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                  }}
                >
                  Weekly Carbon Goal
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #2d6a4f, #52b788)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>
                      {user?.carbon_goal_kg ?? 10}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem" }}>
                      kg/wk
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.88rem",
                      color: isDark ? "#7a9a7e" : "#555",
                      lineHeight: 1.5,
                    }}
                  >
                    Your personal target for weekly food carbon emissions. The UK average is ~{" "}
                    <strong>21 kg</strong> — a goal of 10 kg or less puts you well ahead of the
                    curve. You can adjust this in the <strong>Edit</strong> menu above.
                  </p>
                </div>
              </div>
            )}

            {/* Stats card */}
            <div style={card(isDark)}>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  marginTop: 0,
                  marginBottom: 16,
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                }}
              >
                Activity
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <div style={statChip(isDark)}>
                  <span>⭐</span>
                  <span>
                    <strong>{favCount}</strong> favorite{favCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <Link
                  href="/favorites"
                  style={{
                    ...statChip(isDark),
                    textDecoration: "none",
                    border: `1px solid ${isDark ? "#2d4a35" : "#d8f3dc"}`,
                  }}
                >
                  <span>📂</span>
                  <span>View Favorites</span>
                </Link>
                <Link
                  href="/carbon"
                  style={{
                    ...statChip(isDark),
                    textDecoration: "none",
                    border: `1px solid ${isDark ? "#2d4a35" : "#d8f3dc"}`,
                  }}
                >
                  <span>🌍</span>
                  <span>Carbon Tracker</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
