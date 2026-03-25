import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import Login from "../pages/Login";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders login form with email and password fields", () => {
  renderLogin();
  expect(screen.getByText("Welcome Back")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
});

test("renders link to registration page", () => {
  renderLogin();
  expect(screen.getByText("Create one")).toBeInTheDocument();
});

test("displays error message on login failure", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ error: "Invalid email or password" }),
  });

  renderLogin();
  const user = userEvent.setup();

  await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
  await user.type(screen.getByPlaceholderText("Enter your password"), "WrongPass1");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() => {
    expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
  });
});

test("shows loading state during submission", async () => {
  let resolvePromise;
  global.fetch.mockReturnValueOnce(
    new Promise((resolve) => {
      resolvePromise = resolve;
    })
  );

  renderLogin();
  const user = userEvent.setup();

  await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
  await user.type(screen.getByPlaceholderText("Enter your password"), "TestPass1");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  expect(screen.getByText("Signing in...")).toBeInTheDocument();

  // Resolve to avoid unhandled promise
  resolvePromise({
    ok: true,
    json: () => Promise.resolve({ user: { id: "1" }, token: "tok" }),
  });
});
