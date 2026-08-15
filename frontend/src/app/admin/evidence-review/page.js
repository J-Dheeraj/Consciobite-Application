"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import {
  pageContainer,
  card,
  primaryButton,
  inputField,
  errorAlert,
  formLabel,
} from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceCard({ evidence, isDark, onApprove, onReject, isPending }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#888";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 16,
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c3a28" : "#ecfdf5",
                color: "#27ae60",
              }}
            >
              {SOURCE_TYPE_LABELS[evidence.source_type] || evidence.source_type}
            </span>
            {evidence.year && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: isDark ? "#1c2e22" : "#f3f4f6",
                  color: mutedColor,
                }}
              >
                {evidence.year}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 2,
            }}
          >
            Product #{evidence.product_id}
          </div>
          <div style={{ fontSize: 12, color: mutedColor }}>
            Submitted by {evidence.submitter_email} &middot;{" "}
            {new Date(evidence.submitted_at).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            padding: "4px 10px",
            border: `1px solid ${isDark ? "#2d4a35" : "#d1d5db"}`,
            borderRadius: 6,
            background: "transparent",
            color: mutedColor,
            cursor: "pointer",
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Citation */}
      <p
        style={{
          color: textColor,
          fontSize: 14,
          lineHeight: 1.6,
          margin: "0 0 12px",
          fontStyle: "italic",
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? "none" : 3,
          WebkitBoxOrient: "vertical",
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        &ldquo;{evidence.citation}&rdquo;
      </p>

      {/* Extra fields (expanded only) */}
      {expanded && (
        <div style={{ marginBottom: 12, display: "grid", gap: 4 }}>
          {evidence.methodology && (
            <div style={{ fontSize: 13, color: textColor }}>
              <strong>Methodology:</strong> {evidence.methodology}
            </div>
          )}
          {evidence.url && (
            <div style={{ fontSize: 13 }}>
              <strong style={{ color: textColor }}>URL:</strong>{" "}
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2d6a4f", wordBreak: "break-all" }}
              >
                {evidence.url}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Product link */}
      <Link
        href={`/product/${evidence.product_id}`}
        style={{
          fontSize: 12,
          color: "#2d6a4f",
          fontWeight: 600,
          display: "inline-block",
          marginBottom: 14,
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        View product &rarr;
      </Link>

      {/* Review form */}
      <div style={{ borderTop: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`, paddingTop: 14 }}>
        <label style={formLabel(isDark)}>Reviewer notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes for the submitter or internal record..."
          maxLength={500}
          rows={2}
          disabled={isPending}
          style={{
            ...inputField(isDark, { fullWidth: true }),
            background: isDark ? "#111e17" : "#fafafa",
            color: isDark ? "#e8f5e9" : "#222",
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: 13,
            display: "block",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={() => onApprove(evidence.id, notes)}
            disabled={isPending}
            style={{
              ...primaryButton({ loading: isPending }),
              padding: "9px 20px",
              fontSize: 13,
            }}
          >
            Approve
          </button>
          <button
            onClick={() => onReject(evidence.id, notes)}
            disabled={isPending}
            style={{
              padding: "9px 20px",
              borderRadius: 12,
              border: "none",
              cursor: isPending ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: isDark ? "#3a1a1a" : "#fef2f2",
              color: "#e63946",
            }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    data,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 50 }),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, status, notes),
    onSuccess: (_, { id, status }) => {
      setProcessingId(null);
      setSuccessMsg(`Evidence #${id} ${status}.`);
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (err) => {
      setProcessingId(null);
      setErrorMsg(err?.message || "Review failed. Please try again.");
    },
  });

  const handleDecision = (id, status, notes) => {
    setProcessingId(id);
    setErrorMsg("");
    mutation.mutate({ id, status, notes });
  };

  const textColor = isDark ? "#c8d6c8" : "#444";
  const pending = data?.evidence ?? [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📋"
        title="Evidence Review"
        subtitle="Review and approve community-submitted LCA evidence citations."
      />

      <div style={pageContainer(760)}>
        {/* Admin nav */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            { href: "/admin/conflict-log", label: "Conflict Log" },
            { href: "/admin/manufacturers", label: "Manufacturers" },
            { href: "/admin/evidence-review", label: "Evidence Review" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                background:
                  link.href === "/admin/evidence-review"
                    ? isDark
                      ? "#1c3a28"
                      : "#ecfdf5"
                    : isDark
                      ? "#1c2e22"
                      : "#f3f4f6",
                color:
                  link.href === "/admin/evidence-review" ? "#2d6a4f" : isDark ? "#6b8a6e" : "#555",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Feedback */}
        {successMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: isDark ? "#1c3a28" : "#ecfdf5",
              color: "#27ae60",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {successMsg}
          </div>
        )}
        {errorMsg && <div style={{ marginBottom: 16, ...errorAlert(isDark) }}>{errorMsg}</div>}

        {/* Auth gate */}
        {!isAuthenticated ? (
          <div style={{ ...card(isDark, { padding: 32 }), textAlign: "center" }}>
            <p style={{ color: textColor, marginBottom: 16 }}>
              Admin access required. Please{" "}
              <Link href="/login" style={{ color: "#2d6a4f", fontWeight: 600 }}>
                log in
              </Link>
              .
            </p>
          </div>
        ) : isLoading ? (
          <Spinner message="Loading submissions..." />
        ) : fetchError ? (
          <div style={errorAlert(isDark)}>
            {fetchError?.message?.includes("403") || fetchError?.message?.includes("Admin")
              ? "Admin privileges required to view this page."
              : "Failed to load evidence submissions."}
          </div>
        ) : pending.length === 0 ? (
          <div
            style={{
              ...card(isDark, { padding: 40 }),
              textAlign: "center",
              color: textColor,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>All caught up!</p>
            <p style={{ fontSize: 14, color: isDark ? "#6b8a6e" : "#888", margin: 0 }}>
              No pending evidence submissions.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                  margin: 0,
                }}
              >
                Pending Submissions
              </h2>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: isDark ? "#3a2e1c" : "#fef3c7",
                  color: "#92400e",
                }}
              >
                {pending.length} pending
              </span>
            </div>
            {pending.map((ev) => (
              <EvidenceCard
                key={ev.id}
                evidence={ev}
                isDark={isDark}
                isPending={processingId === ev.id}
                onApprove={(id, notes) => handleDecision(id, "approved", notes)}
                onReject={(id, notes) => handleDecision(id, "rejected", notes)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
