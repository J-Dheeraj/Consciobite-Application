import React from "react";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "authenticated" : "anonymous"}</span>
      <span data-testid="user-name">{user?.name || "none"}</span>
      <button onClick={() => login({ id: "1", name: "Test User" }, "fake-token.eyJpZCI6IjEiLCJleHAiOjk5OTk5OTk5OTl9.sig")}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

test("starts unauthenticated when no stored token", () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
  expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous");
  expect(screen.getByTestId("user-name")).toHaveTextContent("none");
});

test("login sets user and token", () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  act(() => {
    screen.getByText("Login").click();
  });

  expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
  expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
  expect(localStorage.getItem("consciobite_token")).toBeTruthy();
  expect(localStorage.getItem("consciobite_user")).toContain("Test User");
});

test("logout clears user and token", () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  act(() => {
    screen.getByText("Login").click();
  });
  act(() => {
    screen.getByText("Logout").click();
  });

  expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous");
  expect(localStorage.getItem("consciobite_token")).toBeNull();
});

test("restores user from localStorage on mount", () => {
  localStorage.setItem("consciobite_user", JSON.stringify({ id: "1", name: "Stored User" }));
  // Create a non-expired token (payload: {"id":"1","exp":9999999999})
  localStorage.setItem("consciobite_token", "header.eyJpZCI6IjEiLCJleHAiOjk5OTk5OTk5OTl9.sig");

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
  expect(screen.getByTestId("user-name")).toHaveTextContent("Stored User");
});

test("logs out when stored token is expired", () => {
  localStorage.setItem("consciobite_user", JSON.stringify({ id: "1", name: "Old User" }));
  // Expired token (payload: {"id":"1","exp":1000000000} - year 2001)
  localStorage.setItem("consciobite_token", "header.eyJpZCI6IjEiLCJleHAiOjEwMDAwMDAwMDB9.sig");

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous");
});

test("logs out when stored token is malformed", () => {
  localStorage.setItem("consciobite_user", JSON.stringify({ id: "1", name: "Bad Token" }));
  localStorage.setItem("consciobite_token", "not-a-valid-jwt");

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous");
});

test("throws when useAuth used outside AuthProvider", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<TestComponent />)).toThrow("useAuth must be used within AuthProvider");
  spy.mockRestore();
});
