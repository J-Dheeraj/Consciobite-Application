"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCurrentUser, updateProfile, changePassword, deleteAccount } from "@/services/auth";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

function SectionCard({ title, children, isDark, danger }) {
  return (
    <div
      style={{
        ...card(isDark, { radius: 14 }),
        padding: 24,
        marginBottom: 20,
        borderLeft: danger ? "4px solid #e74c3c" : undefined,
      }}
    >
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          marginBottom: 16,
          color: danger ? "#e74c3c" : isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormField({ label, type = "text", value, onChange, placeholder, isDark, required }) {
  const labelColor = isDark ? "#b0c4b1" : "#555";
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${isDark ? "#2d4a35" : "#dde8dd"}`,
    background: isDark ? "#1c2e22" : "#f8faf8",
    color: isDark ? "#e8f5e9" : "#1a3a2a",
    fontSize: "0.92rem",
    outline: "none",
    boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: "0.82rem",
          color: labelColor,
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  );
}

function StatusMessage({ msg, isDark }) {
  if (!msg) return null;
  const isError = msg.startsWith("Error");
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        background: isError
          ? isDark
            ? "rgba(231,57,60,0.12)"
            : "rgba(231,57,60,0.08)"
          : isDark
            ? "rgba(39,174,96,0.12)"
            : "rgba(39,174,96,0.08)",
        color: isError ? "#e74c3c" : "#27ae60",
        fontSize: "0.88rem",
        marginTop: 12,
        border: `1px solid ${isError ? "#e74c3c30" : "#27ae6030"}`,
      }}
    >
      {msg}
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const { isAuthenticated, logout, updateUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [nameValue, setNameValue] = useState("");
  const [nameMsg, setNameMsg] = useState("");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  const [deletePwd, setDeletePwd] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (data?.user?.name) {
      setNameValue(data.user.name);
    }
  }, [data]);

  const profileMutation = useMutation({
    mutationFn: (name) => updateProfile(name),
    onSuccess: (res) => {
      updateUser(res.user);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setNameMsg("Name updated successfully.");
    },
    onError: (err) => {
      setNameMsg(`Error: ${err.message}`);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setPwdMsg("Password changed successfully.");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    },
    onError: (err) => {
      setPwdMsg(`Error: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (password) => deleteAccount(password),
    onSuccess: () => {
      logout();
      router.replace("/");
    },
    onError: (err) => {
      setDeleteMsg(`Error: ${err.message}`);
    },
  });

  const handleNameSubmit = (e) => {
    e.preventDefault();
    setNameMsg("");
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameMsg("Error: Name cannot be empty.");
      return;
    }
    profileMutation.mutate(trimmed);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwdMsg("");
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg("Error: All fields are required.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg("Error: New passwords do not match.");
      return;
    }
    if (
      newPwd.length < 8 ||
      !/[A-Z]/.test(newPwd) ||
      !/[a-z]/.test(newPwd) ||
      !/[0-9]/.test(newPwd)
    ) {
      setPwdMsg(
        "Error: Password must be at least 8 characters with uppercase, lowercase, and a number."
      );
      return;
    }
    passwordMutation.mutate({ currentPassword: currentPwd, newPassword: newPwd });
  };

  const handleDeleteSubmit = (e) => {
    e.preventDefault();
    setDeleteMsg("");
    if (!deletePwd) {
      setDeleteMsg("Error: Password is required.");
      return;
    }
    deleteMutation.mutate(deletePwd);
  };

  if (!isAuthenticated) return null;

  if (isLoading) return <Spinner message="Loading profile..." />;

  const profile = data?.user;
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const textColor = isDark ? "#b0c4b1" : "#555";
  const btnStyle = (danger) => ({
    padding: "10px 24px",
    background: danger ? "#e74c3c" : "#2d6a4f",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    opacity: 1,
  });

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        title="Account Settings"
        subtitle={profile?.email ? `Signed in as ${profile.email}` : "Manage your account"}
      />

      <div style={{ ...pageContainer(), paddingTop: 24, paddingBottom: 48 }}>
        {/* Account info */}
        <SectionCard title="Account Info" isDark={isDark}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Email", value: profile?.email },
              { label: "Display Name", value: profile?.name },
              { label: "Member Since", value: joinedDate ?? "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Update name */}
        <SectionCard title="Change Display Name" isDark={isDark}>
          <form onSubmit={handleNameSubmit}>
            <FormField
              label="Display Name"
              value={nameValue}
              onChange={setNameValue}
              placeholder="Your name"
              isDark={isDark}
              required
            />
            <button type="submit" style={btnStyle(false)} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? "Saving..." : "Save Name"}
            </button>
            <StatusMessage msg={nameMsg} isDark={isDark} />
          </form>
        </SectionCard>

        {/* Change password */}
        <SectionCard title="Change Password" isDark={isDark}>
          <form onSubmit={handlePasswordSubmit}>
            <FormField
              label="Current Password"
              type="password"
              value={currentPwd}
              onChange={setCurrentPwd}
              placeholder="Enter current password"
              isDark={isDark}
              required
            />
            <FormField
              label="New Password"
              type="password"
              value={newPwd}
              onChange={setNewPwd}
              placeholder="At least 8 chars, uppercase, lowercase, number"
              isDark={isDark}
              required
            />
            <FormField
              label="Confirm New Password"
              type="password"
              value={confirmPwd}
              onChange={setConfirmPwd}
              placeholder="Repeat new password"
              isDark={isDark}
              required
            />
            <button type="submit" style={btnStyle(false)} disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "Updating..." : "Change Password"}
            </button>
            <StatusMessage msg={pwdMsg} isDark={isDark} />
          </form>
        </SectionCard>

        {/* Danger zone */}
        <SectionCard title="Danger Zone" isDark={isDark} danger>
          <p style={{ fontSize: "0.88rem", color: textColor, marginBottom: 16, lineHeight: 1.6 }}>
            Permanently deletes your account, all carbon logs, and all reviews. This cannot be
            undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                ...btnStyle(true),
                background: "transparent",
                color: "#e74c3c",
                border: "2px solid #e74c3c",
              }}
            >
              Delete Account
            </button>
          ) : (
            <form onSubmit={handleDeleteSubmit}>
              <FormField
                label="Enter your password to confirm"
                type="password"
                value={deletePwd}
                onChange={setDeletePwd}
                placeholder="Your current password"
                isDark={isDark}
                required
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" style={btnStyle(true)} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? "Deleting..." : "Yes, Delete My Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePwd("");
                    setDeleteMsg("");
                  }}
                  style={{
                    ...btnStyle(false),
                    background: isDark ? "#2d4a35" : "#e8f0e8",
                    color: isDark ? "#95d5b2" : "#2d6a4f",
                  }}
                >
                  Cancel
                </button>
              </div>
              <StatusMessage msg={deleteMsg} isDark={isDark} />
            </form>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
