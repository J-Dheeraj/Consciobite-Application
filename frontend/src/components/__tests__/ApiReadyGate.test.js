import { render, screen, waitFor } from "@testing-library/react";
import ApiReadyGate from "../ApiReadyGate";

describe("ApiReadyGate", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows the wake-up message while the health check is pending", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(
      <ApiReadyGate>
        <div>app content</div>
      </ApiReadyGate>
    );
    expect(screen.getByText("Waking up the server...")).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });

  test("renders children once the health check succeeds", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
    render(
      <ApiReadyGate>
        <div>app content</div>
      </ApiReadyGate>
    );
    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/health"), {
      cache: "no-store",
    });
  });
});
