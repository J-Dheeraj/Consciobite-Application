import React from "react";
import { render, screen } from "@testing-library/react";
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
  expect(screen.getByText("Consciobite")).toBeInTheDocument();
});

test("renders skip navigation link", () => {
  renderApp();
  expect(screen.getByText("Skip to main content")).toBeInTheDocument();
});

test("renders main navigation", () => {
  renderApp();
  expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
});

test("renders 404 page for unknown routes", async () => {
  renderApp("/unknown-page-xyz");
  // The NotFound page is lazy loaded, so we wait for it
  const heading = await screen.findByText(/not found|page.*exist/i, {}, { timeout: 3000 });
  expect(heading).toBeInTheDocument();
});
