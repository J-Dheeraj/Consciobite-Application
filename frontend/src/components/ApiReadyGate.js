"use client";
import { useState, useEffect } from "react";
import { API_BASE } from "@/services/httpClient";

const POLL_INTERVAL = 3000;
const MAX_WAIT = 60000;
// Wait a moment before announcing a slow API so a healthy load never flashes
// the banner.
const GRACE_MS = 2500;

/**
 * Reports backend availability WITHOUT blocking the page.
 *
 * Most of this app is a static export: the home page, product pages and
 * passports are prerendered and need no API call to be useful. An earlier
 * version withheld all children until /api/health responded, which meant a
 * cold start — or an API outage — left every route blank for up to a minute.
 * Now children render immediately and a banner appears only if the API is
 * actually slow or unreachable; per-view loading and error states are handled
 * by React Query where the data is used.
 */
export default function ApiReadyGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ready | slow | unreachable

  useEffect(() => {
    let cancelled = false;
    let timer;
    const start = Date.now();

    const grace = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === "checking" ? "slow" : s));
    }, GRACE_MS);

    async function check() {
      try {
        const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          setStatus("ready");
          return;
        }
      } catch {
        // API not reachable yet
      }
      if (cancelled) return;
      if (Date.now() - start > MAX_WAIT) {
        setStatus("unreachable");
        return;
      }
      timer = setTimeout(check, POLL_INTERVAL);
    }

    check();
    return () => {
      cancelled = true;
      clearTimeout(grace);
      clearTimeout(timer);
    };
  }, []);

  const message =
    status === "slow"
      ? "Waking up the server… live data will appear shortly."
      : status === "unreachable"
        ? "Can't reach the server right now — live data may be unavailable."
        : null;

  return (
    <>
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: "10px 16px",
            textAlign: "center",
            fontSize: "0.88rem",
            background: status === "unreachable" ? "#fff4f4" : "#f0f7f2",
            color: status === "unreachable" ? "#a4243d" : "#2d6a4f",
            borderBottom: `1px solid ${status === "unreachable" ? "#f3d4d4" : "#d8f3dc"}`,
          }}
        >
          {message}
        </div>
      )}
      {children}
    </>
  );
}
