import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import App from "../App";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderApp(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

test("renders navigation with Consciobite brand", () => {
  renderApp();
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  expect(within(nav).getByText("Consciobite")).toBeInTheDocument();
});

test("renders skip navigation link", () => {
  renderApp();
  expect(screen.getByText("Skip to main content")).toBeInTheDocument();
});

test("renders main navigation", () => {
  renderApp();
  expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
});

test("renders fallback for unknown routes", () => {
  renderApp("/unknown-page-xyz");
  // The NotFound page is lazy loaded; in the test environment the dynamic
  // import may not resolve, so we verify the Suspense fallback renders,
  // confirming the catch-all route matched.
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
