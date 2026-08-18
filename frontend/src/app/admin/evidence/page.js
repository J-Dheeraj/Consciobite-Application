"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, inputField, formLabel } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceCard({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#999";
  const borderColor = isDark ? "#2d4a35" : "#e5e7eb";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 16,
        borderLeft: `4px solid ${isDark ? "#3a6b4a" : "#2d6a4f"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c2e22" : "#f3f4f6",
                color: isDark ? "#a7f3d0" : "#2d6a4f",
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
                background: isDark ? "#1c2a3a" : "#eff6ff",
                color: isDark ? "#93c5fd" : "#1d4ed8",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && <span style={{ fontSize: 12, color: mutedColor }}>{item.year}</span>}
          </div>

          <p
            style={{
              color: textColor,
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 6px",
              fontWeight: 500,
            }}
          >
            {item.citation}
          </p>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: isDark ? "#86efac" : "#2d6a4f",
                wordBreak: "break-all",
                textDecoration: "none",
              }}
            >
              {item.url}
            </a>
          )}
        </div>

        <div style={{ fontSize: 12, color: mutedColor, textAlign: "right", minWidth: 120 }}>
          <div>{item.submitter_email}</div>
          <div>{new Date(item.submitted_at).toLocaleDateString()}</div>
        </div>
      </div>

      {item.methodology && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: isDark ? "#86efac" : "#2d6a4f",
              padding: 0,
              fontWeight: 600,
            }}
          >
            {expanded ? "Hide methodology" : "Show methodology"}
          </button>
          {expanded && (
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                color: textColor,
                lineHeight: 1.6,
                padding: "10px 12px",
                borderRadius: 8,
                background: isDark ? "#111d14" : "#f9fafb",
                border: `1px solid ${borderColor}`,
              }}
            >
              {item.methodology}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 14, borderTop: `1px solid ${borderColor}`, paddingTop: 14 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          <span style={formLabel(isDark)}>Reviewer notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Reason for approval or rejection..."
            style={{
              ...inputField(isDark, { radius: 8, fullWidth: true }),
              resize: "vertical",
              minHeight: 60,
              fontFamily: "inherit",
            }}
          />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onReview(item.id, { status: "approved", notes })}
            disabled={reviewing}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: reviewing ? "#555" : "#2d6a4f",
              color: "#fff",
              transition: "all 0.15s ease",
            }}
          >
            Approve
          </button>
          <button
            onClick={() => onReview(item.id, { status: "rejected", notes })}
            disabled={reviewing}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: reviewing ? "#555" : isDark ? "#3a1c1c" : "#fee2e2",
              color: reviewing ? "#ccc" : isDark ? "#fca5a5" : "#991b1b",
              transition: "all 0.15s ease",
            }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEvidencePage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewed, setReviewed] = useState([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 50 }),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, payload }) => reviewEvidence(id, payload),
    onSuccess: (_, { id }) => {
      setReviewed((prev) => [...prev, id]);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
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

  const pending = (data?.evidence || []).filter((item) => !reviewed.includes(item.id));

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📋"
        title="Evidence Review Queue"
        subtitle="Review community-submitted evidence citations. Approved entries become visible on the product page."
      />

      <div style={pageContainer(800)}>
        {review.isError && (
          <div
            role="alert"
            style={{
              padding: 12,
              borderRadius: 8,
              background: isDark ? "#3a1c1c" : "#fee2e2",
              color: isDark ? "#fca5a5" : "#991b1b",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {review.error?.message || "Failed to submit review. Please try again."}
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
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              margin: 0,
            }}
          >
            Pending Submissions ({pending.length})
          </h2>
          {reviewed.length > 0 && (
            <span
              style={{
                fontSize: 13,
                color: isDark ? "#86efac" : "#2d6a4f",
                fontWeight: 600,
              }}
            >
              {reviewed.length} reviewed this session
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 12 }),
              padding: 48,
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
              fontSize: 15,
            }}
          >
            {reviewed.length > 0
              ? `All done — ${reviewed.length} submission${reviewed.length === 1 ? "" : "s"} reviewed.`
              : "No pending evidence submissions."}
          </div>
        ) : (
          pending.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              isDark={isDark}
              reviewing={review.isPending && review.variables?.id === item.id}
              onReview={(id, payload) => review.mutate({ id, payload })}
            />
          ))
        )}
      </div>
    </div>
  );
}
