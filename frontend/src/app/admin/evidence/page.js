"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, inputField, errorAlert } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function formatDate(iso) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function EvidenceRow({ item, isDark, onAction, actionLoading }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: "16px 20px" }),
        marginBottom: 12,
        borderLeft: `4px solid ${isDark ? "#40916c" : "#2d6a4f"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                background: isDark ? "#0d2118" : "#e8f5e9",
                color: isDark ? "#95d5b2" : "#1b5e20",
              }}
            >
              Product #{item.product_id}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 6,
                background: isDark ? "#1a1a2e" : "#f3f4f6",
                color: isDark ? "#a0aec0" : "#555",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && (
              <span style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999" }}>{item.year}</span>
            )}
            <span style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999", marginLeft: "auto" }}>
              {formatDate(item.submitted_at)}
            </span>
          </div>

          <p
            style={{
              margin: "0 0 4px",
              fontSize: 14,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              lineHeight: 1.5,
            }}
          >
            {item.citation}
          </p>

          <div style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999" }}>
            Submitted by {item.submitter_email}
          </div>

          {(item.methodology || item.url) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isDark ? "#95d5b2" : "#2d6a4f",
                fontSize: 12,
                padding: "4px 0",
                marginTop: 4,
              }}
            >
              {expanded ? "Hide details ▲" : "Show details ▼"}
            </button>
          )}

          {expanded && (
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 8,
                background: isDark ? "#0d1f15" : "#f9f9f9",
                fontSize: 13,
              }}
            >
              {item.methodology && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: isDark ? "#b0c4b1" : "#555" }}>
                    Methodology:{" "}
                  </span>
                  <span style={{ color: isDark ? "#e8f5e9" : "#333" }}>{item.methodology}</span>
                </div>
              )}
              {item.url && (
                <div>
                  <span style={{ fontWeight: 600, color: isDark ? "#b0c4b1" : "#555" }}>URL: </span>
                  <span
                    style={{
                      wordBreak: "break-all",
                      color: isDark ? "#95d5b2" : "#2d6a4f",
                      fontSize: 12,
                    }}
                  >
                    {item.url}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reviewer notes (optional)"
          rows={2}
          style={{
            ...inputField(isDark, { radius: 8 }),
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            fontSize: 13,
            fontFamily: "inherit",
            background: isDark ? "#0d2118" : "#fafafa",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            disabled={actionLoading}
            onClick={() => onAction(item.id, "approved", notes)}
            style={{
              ...primaryButton({ loading: actionLoading }),
              padding: "8px 18px",
              fontSize: 13,
              flex: 1,
            }}
          >
            ✓ Approve
          </button>
          <button
            disabled={actionLoading}
            onClick={() => onAction(item.id, "rejected", notes)}
            style={{
              padding: "8px 18px",
              background: actionLoading ? "#fecaca" : "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: actionLoading ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: 13,
              flex: 1,
            }}
          >
            ✗ Reject
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
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onSuccess: () => {
      setSuccessCount((c) => c + 1);
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
    },
    onError: (err) => {
      setActionError(err.message || "Action failed");
      setActioningId(null);
    },
  });

  const handleAction = (id, status, notes) => {
    setActionError("");
    setActioningId(id);
    review.mutate({ id, status, notes }, { onSettled: () => setActioningId(null) });
  };

  if (initializing) return null;

  if (!isAuthenticated) {
    return (
      <main style={pageContainer(760)}>
        <PageHero title="Evidence Review" subtitle="Admin access required" icon="🔒" />
        <p style={{ textAlign: "center", color: isDark ? "#6b8a6e" : "#999" }}>
          Please sign in with an admin account to access this page.
        </p>
      </main>
    );
  }

  const pendingItems = data?.evidence || [];

  return (
    <main style={pageContainer(760)}>
      <PageHero
        title="Evidence Review"
        subtitle="Review and approve community-submitted evidence citations"
        icon="🔬"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span
            style={{
              ...card(isDark, { radius: 10, padding: "8px 16px" }),
              fontSize: 14,
              fontWeight: 600,
              color: isDark ? "#a7f3d0" : "#2d6a4f",
            }}
          >
            {isLoading ? "…" : pendingItems.length} pending
          </span>
          {successCount > 0 && (
            <span
              style={{
                fontSize: 13,
                color: isDark ? "#95d5b2" : "#2d6a4f",
                padding: "8px 12px",
                borderRadius: 8,
                background: isDark ? "#0d2118" : "#e8f5e9",
              }}
            >
              {successCount} reviewed this session
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/admin/conflict-log"
            style={{
              fontSize: 13,
              color: isDark ? "#95d5b2" : "#2d6a4f",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "#2d4a35" : "#c8e6c9"}`,
            }}
          >
            Conflict Log
          </a>
          <a
            href="/admin/manufacturers"
            style={{
              fontSize: 13,
              color: isDark ? "#95d5b2" : "#2d6a4f",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "#2d4a35" : "#c8e6c9"}`,
            }}
          >
            Manufacturers
          </a>
        </div>
      </div>

      {actionError && <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>{actionError}</div>}

      {isLoading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spinner />
        </div>
      )}

      {error && (
        <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>
          {error.message?.includes("Admin")
            ? "You need admin privileges to view this page."
            : "Failed to load pending evidence. Please refresh."}
        </div>
      )}

      {!isLoading && !error && pendingItems.length === 0 && (
        <div
          style={{
            ...card(isDark, { radius: 14, padding: "48px 24px" }),
            textAlign: "center",
            color: isDark ? "#6b8a6e" : "#999",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No pending submissions</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>
            All community evidence has been reviewed.
          </div>
        </div>
      )}

      {pendingItems.map((item) => (
        <EvidenceRow
          key={item.id}
          item={item}
          isDark={isDark}
          onAction={handleAction}
          actionLoading={actioningId === item.id}
        />
      ))}
    </main>
  );
}
