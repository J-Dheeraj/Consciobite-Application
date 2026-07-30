"use client";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import ApiReadyGate from "@/components/ApiReadyGate";
import { initSentry } from "@/services/sentry";

export default function Providers({ children }) {
  useEffect(() => {
    initSentry();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ApiReadyGate>
          <AuthProvider>{children}</AuthProvider>
        </ApiReadyGate>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
