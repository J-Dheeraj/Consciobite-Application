"use client";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import ApiReadyGate from "@/components/ApiReadyGate";
import { initSentry } from "@/services/sentry";
import { useOnApiReady } from "@/utils/useOnApiReady";

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

  // A query that failed while the API was still waking would otherwise stay
  // failed until the user reloaded.
  useOnApiReady(() => {
    queryClient.refetchQueries({ predicate: (query) => query.state.status === "error" });
  });

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
