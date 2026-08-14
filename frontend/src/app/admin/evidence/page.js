"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceCard({ item, onApprove, onReject, isPending, isDark }) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const borderColor = isDark ? "#2d4a35" : "#e5e7eb";
  const labelColor = isDark ? "#a7c7ae" : "#555";
  const valueColor = isDark ? "#e8f5e9" : "#1a3a2a";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        border: `1px solid ${borderColor}`,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isDark ? "#6b8a6e" : "#888",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Product #{item.product_id}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: isDark ? "#1e3a26" : "#e8f5e9",
                color: isDark ? "#a7f3d0" : "#2d6a4f",
                borderRadius: 6,
                padding: "2px 8px",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && (
              <span style={{ fontSize: 11, color: labelColor }}>{item.year}</span>
            )}
          </div>

          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: valueColor, marginBottom: 8 }}>
            {item.citation}
          </div>

          {item.methodology && (
            <div style={{ fontSize: "0.85rem", color: labelColor, marginBottom: 4 }}>
              <strong>Methodology:</strong> {item.methodology}
            </div>
          )}

          {item.url && (
            <div style={{ fontSize: "0.85rem", color: labelColor, marginBottom: 4 }}>
              <strong>URL:</strong>{" "}
              <span style={{ wordBreak: "break-all" }}>{item.url}</span>
            </div>
          )}

          <div style={{ fontSize: "0.82rem", color: isDark ? "#6b8a6e" : "#999", marginTop: 6 }}>
            Submitted by {item.submitter_email} &middot;{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
          <button
            style={{
              ...primaryButton({ loading: isPending }),
              background: isPending ? "#95d5b2" : "#27ae60",
              fontSize: "0.85rem",
              padding: "8px 16px",
            }}
            disabled={isPending}
            onClick={() => onApprove(item.id, notes)}
          >
            Approve
          </button>
          <button
            style={{
              ...primaryButton({ loading: isPending }),
              background: isPending ? "#95d5b2" : "#e74c3c",
              fontSize: "0.85rem",
              padding: "8px 16px",
            }}
            disabled={isPending}
            onClick={() => onReject(item.id, notes)}
          >
            Reject
          </button>
          <button
            style={{
              background: "transparent",
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              color: labelColor,
              fontSize: "0.78rem",
              padding: "5px 10px",
              cursor: "pointer",
            }}
            onClick={() => setShowNotes((v) => !v)}
          >
            {showNotes ? "Hide notes" : "Add notes"}
          </button>
        </div>
      </div>

      {showNotes && (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional reviewer notes (max 500 chars)"
            maxLength={500}
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: isDark ? "#1a2e1e" : "#f8fafb",
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              color: valueColor,
              padding: "10px 12px",
              fontSize: "0.88rem",
              resize: "vertical",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminEvidencePage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, status, notes),
    onSuccess: () => {
      setSuccessCount((c) => c + 1);
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
    },
    onError: (err) => {
      setActionError(err.message || "Failed to submit review");
    },
  });

  const handleApprove = (id, notes) => reviewMutation.mutate({ id, status: "approved", notes });
  const handleReject = (id, notes) => reviewMutation.mutate({ id, status: "rejected", notes });

  if (initializing) return null;

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to view this page."
        />
      </div>
    );
  }

  if (isLoading) return <Spinner message="Loading pending evidence..." />;

  if (error) {
    const isAdminError = error.message?.includes("Admin") || error.message?.includes("403");
    return (
      <div>
        <PageHero
          icon="🔒"
          title={isAdminError ? "Access Denied" : "Error"}
          subtitle={isAdminError ? "Admin privileges required." : error.message}
        />
      </div>
    );
  }

  const items = data?.evidence || [];

  return (
    <div style={pageContainer(900)}>
      <PageHero
        icon="📋"
        title="Pending Evidence Review"
        subtitle={`${items.length} submission${items.length !== 1 ? "s" : ""} awaiting review`}
      />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px 48px" }}>
        {successCount > 0 && (
          <div
            style={{
              background: isDark ? "#1e3a26" : "#e8f5e9",
              border: `1px solid ${isDark ? "#2d6a4f" : "#a7d7b1"}`,
              borderRadius: 10,
              padding: "12px 18px",
              marginBottom: 20,
              color: isDark ? "#a7f3d0" : "#2d6a4f",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {successCount} submission{successCount !== 1 ? "s" : ""} reviewed.
          </div>
        )}

        {actionError && (
          <div
            style={{
              background: isDark ? "#3a1e1e" : "#fde8e8",
              border: `1px solid ${isDark ? "#7a2e2e" : "#f5a7a7"}`,
              borderRadius: 10,
              padding: "12px 18px",
              marginBottom: 20,
              color: isDark ? "#f5a7a7" : "#c0392b",
              fontSize: "0.9rem",
            }}
          >
            {actionError}
          </div>
        )}

        {items.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14 }),
              padding: 40,
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
              fontSize: "0.95rem",
            }}
          >
            No pending submissions. All caught up!
          </div>
        ) : (
          items.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              isPending={reviewMutation.isPending}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );
}
