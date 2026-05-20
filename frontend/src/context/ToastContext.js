"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

const TOAST_COLORS = {
  success: "#2d6a4f",
  error: "#e63946",
  info: "#4a7c9e",
};

function ToastList({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "#fff",
            background: TOAST_COLORS[t.type] || TOAST_COLORS.info,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            animation: "fadeInUp 0.25s ease",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastList toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
