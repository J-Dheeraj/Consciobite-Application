"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, inputField, errorAlert, formLabel } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed: "Peer Reviewed",
  industry_report: "Industry Report",
  government: "Government",
  ngo: "NGO",
  community: "Community",
};

function EvidenceCard({ item, isDark, onReview }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#999";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 14,
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c2e22" : "#ecfdf5",
                color: "#2d6a4f",
              }}
            >
              #{item.id}
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: isDark ? "#1c2333" : "#eff6ff",
                color: "#1d4ed8",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && (
              <span style={{ fontSize: 12, color: mutedColor }}>{item.year}</span>
            )}
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            Product ID: {item.product_id}
          </div>
          <div style={{ fontSize: 13, color: textColor, lineHeight: 1.6, marginBottom: 6 }}>
            {item.citation}
          </div>
          {item.methodology && (
            <div style={{ fontSize: 12, color: mutedColor, fontStyle: "italic" }}>
              Methodology: {item.methodology}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#2d6a4f",
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? "Hide review" : "Review"}
        </button>
      </div>

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: "#2d6a4f", display: "block", marginTop: 6 }}
        >
          {item.url}
        </a>
      )}

      <div style={{ fontSize: 12, color: mutedColor, marginTop: 8 }}>
        Submitted: {new Date(item.submitted_at).toLocaleString()}
      </div>

      {/* Review panel */}
      {expanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
          }}
        >
          <label style={formLabel(isDark)}>
            Review notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              style={{
                ...inputField(isDark, { radius: 10 }),
                display: "block",
                marginTop: 6,
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
                fontSize: 14,
                background: isDark ? "#0f1c13" : "#fafafa",
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            />
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={() => onReview(item.id, "approved", notes)}
              style={{
                ...primaryButton(),
                padding: "8px 18px",
                fontSize: 13,
              }}
            >
              Approve
            </button>
            <button
              onClick={() => onReview(item.id, "rejected", notes)}
              style={{
                padding: "8px 18px",
                background: isDark ? "#2a1519" : "#fee2e2",
                color: "#dc2626",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEvidencePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 100 }),
    enabled: !!user && user.role === "admin",
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onSuccess: (_, { status }) => {
      setSuccessMsg(`Evidence ${status}.`);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setSuccessMsg(null);
    },
  });

  const handleReview = (id, status, notes) => {
    mutation.mutate({ id, status, notes });
  };

  const textColor = isDark ? "#c8d6c8" : "#444";
  const pending = data?.evidence ?? [];

  if (!user || user.role !== "admin") {
    return (
      <div style={{ textAlign: "center", padding: 60, color: textColor }}>
        Admin access required.
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review"
        subtitle="Review and approve community-submitted evidence citations."
      />

      <div style={pageContainer(780)}>
        {successMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: 14,
              background: isDark ? "#0f2a1a" : "#ecfdf5",
              color: "#2d6a4f",
              borderRadius: 10,
              border: "1px solid #6ee7b7",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ marginBottom: 16, ...errorAlert(isDark) }}>{errorMsg}</div>
        )}

        {isLoading ? (
          <Spinner message="Loading pending evidence..." />
        ) : error ? (
          <div style={errorAlert(isDark)}>Failed to load evidence: {error.message}</div>
        ) : pending.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14 }),
              padding: 40,
              textAlign: "center",
              color: textColor,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>No pending evidence submissions</div>
            <div style={{ fontSize: 14, color: isDark ? "#6b8a6e" : "#999", marginTop: 6 }}>
              All community submissions have been reviewed.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: 18,
                fontSize: 14,
                color: textColor,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: isDark ? "#3a2e1c" : "#fef3c7",
                  color: "#92400e",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {pending.length} pending
              </span>
              <span style={{ color: isDark ? "#6b8a6e" : "#999" }}>
                Review each citation before it appears publicly.
              </span>
            </div>

            {pending.map((item) => (
              <EvidenceCard
                key={item.id}
                item={item}
                isDark={isDark}
                onReview={handleReview}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
