import { useEffect, useRef } from "react";
import { API_READY_EVENT } from "./constants";

/**
 * Runs `callback` when the API becomes reachable after a slow or failed start.
 * For views that fetch outside React Query; queries are retried centrally in
 * Providers.
 */
export function useOnApiReady(callback) {
  // Latest callback without re-subscribing on every render.
  const latest = useRef(callback);
  latest.current = callback;

  useEffect(() => {
    const handler = () => latest.current();
    window.addEventListener(API_READY_EVENT, handler);
    return () => window.removeEventListener(API_READY_EVENT, handler);
  }, []);
}
