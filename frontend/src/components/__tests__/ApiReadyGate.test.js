import { render, screen, waitFor } from "@testing-library/react";
import ApiReadyGate from "../ApiReadyGate";

describe("ApiReadyGate", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The point of this component: static content must never wait on the API.
  test("renders children immediately while the health check is still pending", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(
      <ApiReadyGate>
        <div>app content</div>
      </ApiReadyGate>
    );
    expect(screen.getByText("app content")).toBeInTheDocument();
  });

  test("renders children when the API is down", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("connection refused")));
    render(
      <ApiReadyGate>
        <div>app content</div>
      </ApiReadyGate>
    );
    expect(screen.getByText("app content")).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByText("app content")).toBeInTheDocument();
  });

  test("shows no banner on a healthy API", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
    render(
      <ApiReadyGate>
        <div>app content</div>
      </ApiReadyGate>
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/health"), {
      cache: "no-store",
    });
  });

  test("announces a slow API without hiding the page", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(
      <ApiReadyGate>
        <div>app content</div>
      </ApiReadyGate>
    );
    jest.advanceTimersByTime(3000);
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent(/waking up the server/i);
    expect(screen.getByText("app content")).toBeInTheDocument();
    jest.useRealTimers();
  });
});
