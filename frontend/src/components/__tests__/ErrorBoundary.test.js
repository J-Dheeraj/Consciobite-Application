import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

jest.mock("@/services/sentry", () => ({
  captureError: jest.fn(),
}));

function Boom() {
  throw new Error("boom");
}

function Safe() {
  return <div>safe content</div>;
}

let shouldThrow = true;
function Controlled() {
  if (shouldThrow) throw new Error("controlled");
  return <div>recovered</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <Safe />
      </ErrorBoundary>
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  test("renders error UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("shows Try Again and Refresh Page buttons in error state", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
  });

  test("calls captureError with the thrown error", () => {
    const { captureError } = require("@/services/sentry");
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "boom" }),
      expect.any(Object)
    );
  });

  test("Try Again resets the error state and allows recovery", () => {
    shouldThrow = true;
    render(
      <ErrorBoundary>
        <Controlled />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    // Allow the child to succeed on next render
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText("recovered")).toBeInTheDocument();
  });
});
