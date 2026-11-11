import { render, screen, waitFor, act } from "@testing-library/react";
import ApiReadyGate from "../ApiReadyGate";
import { API_READY_EVENT } from "../../utils/constants";

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
  // Cold start: the API fails for a while, then comes up. Anything that
  // fetched and failed in the meantime needs to be told it can try again.
  describe("recovery", () => {
    let ready;
    const onReady = () => ready++;
    beforeEach(() => {
      ready = 0;
      jest.useFakeTimers();
      window.addEventListener(API_READY_EVENT, onReady);
    });
    afterEach(() => {
      window.removeEventListener(API_READY_EVENT, onReady);
      jest.useRealTimers();
    });

    // Timer-driven state updates must be flushed inside act().
    const advance = (ms) => act(() => jest.advanceTimersByTimeAsync(ms));

    const mount = () =>
      render(
        <ApiReadyGate>
          <div>app content</div>
        </ApiReadyGate>
      );

    test("announces readiness once the API recovers from a failed check", async () => {
      let up = false;
      global.fetch = jest.fn(() =>
        up ? Promise.resolve({ ok: true }) : Promise.reject(new Error("down"))
      );
      mount();
      await advance(7000);
      expect(screen.getByRole("status")).toHaveTextContent(/waking up the server/i);
      expect(ready).toBe(0);

      up = true;
      await advance(4000);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(ready).toBe(1);
    });

    test("stays quiet when the API was healthy from the start", async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
      mount();
      await advance(5000);
      expect(ready).toBe(0);
    });

    test("keeps checking after giving up, and recovers when the API returns", async () => {
      let up = false;
      global.fetch = jest.fn(() =>
        up ? Promise.resolve({ ok: true }) : Promise.reject(new Error("down"))
      );
      mount();
      await advance(70000);
      expect(screen.getByRole("status")).toHaveTextContent(/can't reach the server/i);
      const callsWhenUnreachable = global.fetch.mock.calls.length;

      up = true;
      await advance(20000);
      expect(global.fetch.mock.calls.length).toBeGreaterThan(callsWhenUnreachable);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(ready).toBe(1);
    });
  });
});
