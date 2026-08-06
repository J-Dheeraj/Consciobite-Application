"use client";
import React, { useState } from "react";
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

function EvidenceCard({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#888";
  const borderColor = isDark ? "#1c2e22" : "#e5e7eb";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 16,
        borderLeft: `4px solid ${isDark ? "#2d6a4f" : "#40916c"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: mutedColor,
              marginRight: 8,
            }}
          >
            Product #{item.product_id}
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: "#27ae60",
            }}
          >
            {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </span>
        </div>
        <span style={{ fontSize: 12, color: mutedColor }}>
          {new Date(item.submitted_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <p
        style={{
          margin: "12px 0 8px",
          fontSize: 14,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        {item.citation}
      </p>

      <div style={{ fontSize: 13, color: textColor, marginBottom: 4 }}>
        Submitted by{" "}
        <span style={{ fontWeight: 600, color: isDark ? "#a7f3d0" : "#2d6a4f" }}>
          {item.submitter_email}
        </span>
      </div>

      {(item.url || item.methodology || item.year) && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            color: mutedColor,
            padding: "4px 0",
            marginBottom: 4,
          }}
        >
          {expanded ? "▲ Hide details" : "▼ Show details"}
        </button>
      )}

      {expanded && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: isDark ? "#0e1a12" : "#f9fafb",
            marginBottom: 12,
            fontSize: 13,
            color: textColor,
            lineHeight: 1.7,
          }}
        >
          {item.year && (
            <div>
              <strong>Year:</strong> {item.year}
            </div>
          )}
          {item.methodology && (
            <div>
              <strong>Methodology:</strong> {item.methodology}
            </div>
          )}
          {item.url && (
            <div style={{ wordBreak: "break-all" }}>
              <strong>URL:</strong>{" "}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: isDark ? "#74c69d" : "#2d6a4f" }}
              >
                {item.url}
              </a>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          borderTop: `1px solid ${borderColor}`,
          paddingTop: 14,
          marginTop: 8,
        }}
      >
        <label style={{ display: "block", marginBottom: 8 }}>
          <span style={formLabel(isDark)}>Reviewer notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for approval or rejection..."
            maxLength={500}
            style={inputField(isDark, { radius: 8, fullWidth: true })}
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onReview({ id: item.id, status: "approved", notes: notes.trim() || undefined })}
            disabled={reviewing}
            style={{
              ...primaryButton({ loading: reviewing }),
              fontSize: 13,
              padding: "8px 18px",
            }}
          >
            {reviewing ? "..." : "Approve"}
          </button>
          <button
            onClick={() => onReview({ id: item.id, status: "rejected", notes: notes.trim() || undefined })}
            disabled={reviewing}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: `1.5px solid ${isDark ? "#4a2020" : "#fecaca"}`,
              background: isDark ? "#2a1519" : "#fef2f2",
              color: "#e63946",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: 13,
              transition: "all 0.15s ease",
            }}
          >
            {reviewing ? "..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [reviewingId, setReviewingId] = useState(null);
  const [toast, setToast] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: fetchPendingEvidence,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const review = useMutation({
    mutationFn: reviewEvidence,
    onMutate: ({ id }) => setReviewingId(id),
    onSuccess: (_, { status }) => {
      setReviewingId(null);
      setToast(`Evidence ${status}.`);
      setTimeout(() => setToast(null), 3000);
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
    },
    onError: (err) => {
      setReviewingId(null);
      setToast(`Error: ${err.message}`);
      setTimeout(() => setToast(null), 4000);
    },
  });

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
          title="Access Denied"
          subtitle={isAdminError ? "Admin role required to view this page." : error.message}
        />
      </div>
    );
  }

  const pending = data?.evidence || [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📋"
        title="Evidence Review"
        subtitle={`Review community-submitted evidence citations before they go public. ${pending.length} pending.`}
      />

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 999,
            padding: "12px 20px",
            borderRadius: 10,
            background: toast.startsWith("Error") ? "#fef2f2" : "#ecfdf5",
            color: toast.startsWith("Error") ? "#e63946" : "#27ae60",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            border: `1px solid ${toast.startsWith("Error") ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          {toast}
        </div>
      )}

      <div style={pageContainer(820)}>
        {pending.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14 }),
              padding: 48,
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
              animation: "fadeInUp 0.4s ease both",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              All caught up
            </div>
            <div style={{ fontSize: 14 }}>No pending evidence submissions to review.</div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 13,
                color: isDark ? "#6b8a6e" : "#888",
                marginBottom: 20,
                fontWeight: 500,
              }}
            >
              Showing {pending.length} pending submission{pending.length !== 1 ? "s" : ""} — oldest
              first
            </div>
            {pending.map((item, i) => (
              <div
                key={item.id}
                style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}
              >
                <EvidenceCard
                  item={item}
                  isDark={isDark}
                  onReview={(args) => review.mutate(args)}
                  reviewing={reviewingId === item.id}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
