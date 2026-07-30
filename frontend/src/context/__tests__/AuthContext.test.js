import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";

function Probe() {
  const { user, isAuthenticated, initializing, logout } = useAuth();
  return (
    <div>
      <span>{initializing ? "initializing" : "ready"}</span>
      <span>{isAuthenticated ? "authed" : "anonymous"}</span>
      <span>{user ? user.name : "no-user"}</span>
      <button onClick={logout}>logout</button>
    </div>
  );
}

// Minimal JWT with a far-future exp so getTokenExpiry works
const FAKE_JWT = ["h", btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })), "s"]
  .map((p) => p.replace(/=+$/, ""))
  .join(".");

describe("AuthContext", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("never writes the token to localStorage", async () => {
    global.fetch = jest.fn((url) => {
      if (String(url).includes("/auth/refresh")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ token: FAKE_JWT, expiresAt: Date.now() + 2 * 60 * 60 * 1000 }),
        });
      }
      if (String(url).includes("/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: "1", name: "Restored User" } }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("authed")).toBeInTheDocument());
    expect(screen.getByText("Restored User")).toBeInTheDocument();
    expect(localStorage.getItem("consciobite_token")).toBeNull();
    expect(localStorage.getItem("consciobite_user")).toBeNull();
  });

  test("stays anonymous when session restore fails", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());
    expect(screen.getByText("anonymous")).toBeInTheDocument();
  });

  test("logout calls the revocation endpoint and clears state", async () => {
    const calls = [];
    global.fetch = jest.fn((url, opts) => {
      calls.push({ url: String(url), method: opts?.method });
      if (String(url).includes("/auth/refresh")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ token: FAKE_JWT, expiresAt: Date.now() + 2 * 60 * 60 * 1000 }),
        });
      }
      if (String(url).includes("/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: "1", name: "Restored User" } }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText("authed")).toBeInTheDocument());

    await act(async () => {
      screen.getByText("logout").click();
    });

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());
    const logoutCall = calls.find((c) => c.url.includes("/auth/logout"));
    expect(logoutCall).toBeDefined();
    expect(logoutCall.method).toBe("POST");
  });
});
