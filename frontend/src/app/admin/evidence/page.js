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

function EvidenceRow({ item, isDark, onApprove, onReject, isPending }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        ...card(isDark, { padding: 16, radius: 10 }),
        marginBottom: 12,
        borderLeft: `3px solid ${isDark ? "#2d6a4f" : "#52b788"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            Product #{item.product_id}
            <span
              style={{
                marginLeft: 8,
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: isDark ? "#1c2e22" : "#f0fdf4",
                color: isDark ? "#86efac" : "#166534",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: isDark ? "#b0c4b1" : "#444",
              marginBottom: 4,
              wordBreak: "break-word",
            }}
          >
            {item.citation}
          </div>
          <div style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#888" }}>
            Submitted by {item.submitter_email} &middot;{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
            {item.year && ` · ${item.year}`}
          </div>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: isDark ? "#86efac" : "#2d6a4f",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? "Hide details ▲" : "Review ▼"}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${isDark ? "#1c2e22" : "#e5e7eb"}`,
          }}
        >
          {item.url && (
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <span style={{ color: isDark ? "#6b8a6e" : "#888" }}>URL: </span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: isDark ? "#86efac" : "#2d6a4f", wordBreak: "break-all" }}
              >
                {item.url}
              </a>
            </div>
          )}
          {item.methodology && (
            <div style={{ fontSize: 12, marginBottom: 8, color: isDark ? "#b0c4b1" : "#555" }}>
              <span style={{ fontWeight: 600 }}>Methodology: </span>
              {item.methodology}
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reviewer notes (optional, max 500 chars)"
            maxLength={500}
            rows={2}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${isDark ? "#2d4a35" : "#d1fae5"}`,
              background: isDark ? "#0d1f14" : "#f9fafb",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              fontSize: 13,
              resize: "vertical",
              boxSizing: "border-box",
              marginBottom: 10,
            }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onApprove(item.id, notes)}
              disabled={isPending}
              style={{
                ...primaryButton({ loading: isPending }),
                background: "#27ae60",
                fontSize: 13,
                padding: "8px 16px",
              }}
            >
              Approve
            </button>
            <button
              onClick={() => onReject(item.id, notes)}
              disabled={isPending}
              style={{
                ...primaryButton({ loading: isPending }),
                background: isDark ? "#7f1d1d" : "#dc2626",
                fontSize: 13,
                padding: "8px 16px",
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

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
      setToast(`Evidence #${vars.id} ${vars.status}.`);
      setTimeout(() => setToast(null), 3000);
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
          title="Access Denied"
          subtitle={isAdminError ? "Admin role required to view this page." : error.message}
        />
      </div>
    );
  }

  const items = data?.evidence || [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review Queue"
        subtitle="Review community-submitted LCA citations before they appear on product pages."
      />

      <div style={pageContainer(800)}>
        {toast && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: "#27ae60",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {toast}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 14, color: isDark ? "#b0c4b1" : "#555", fontWeight: 600 }}>
            {items.length} submission{items.length !== 1 ? "s" : ""} pending review
          </div>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              ...card(isDark, { padding: 40, radius: 14 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            No pending evidence submissions. All caught up!
          </div>
        ) : (
          items.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isDark={isDark}
              onApprove={handleApprove}
              onReject={handleReject}
              isPending={reviewMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
