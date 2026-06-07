"use client";
import { useState, useEffect } from "react";
import { API_BASE } from "@/services/httpClient";

const POLL_INTERVAL = 3000;
const MAX_WAIT = 60000;

export default function ApiReadyGate({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function check() {
      try {
        const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
        if (res.ok && !cancelled) {
          setReady(true);
          return;
        }
      } catch {
        // server not ready yet
      }
      if (cancelled) return;
      if (Date.now() - start > MAX_WAIT) {
        setReady(true);
        return;
      }
      setTimeout(check, POLL_INTERVAL);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (ready) return children;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: 32,
        color: "var(--text-secondary, #666)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #d8f3dc",
          borderTopColor: "#2d6a4f",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: 20,
        }}
      />
      <p
        style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary, #1b4332)", margin: 0 }}
      >
        Waking up the server...
      </p>
      <p style={{ fontSize: 14, marginTop: 8, maxWidth: 360 }}>
        Our API runs on a free tier and may take 30-60 seconds to start after being idle.
      </p>
    </div>
  );
}
