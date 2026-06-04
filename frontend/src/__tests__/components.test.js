/**
 * Smoke tests for key UI components.
 * Verifies render without crash and presence of core content.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// --- Spinner ---
import Spinner from "../components/Spinner";

describe("Spinner", () => {
  it("renders default loading message", () => {
    render(<Spinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders a custom message", () => {
    render(<Spinner message="Fetching products..." />);
    expect(screen.getByText("Fetching products...")).toBeInTheDocument();
  });
});

// --- PageHero ---
import PageHero from "../components/PageHero";

describe("PageHero", () => {
  it("renders title", () => {
    render(<PageHero title="My Page" />);
    expect(screen.getByRole("heading", { name: "My Page" })).toBeInTheDocument();
  });

  it("renders icon and subtitle when provided", () => {
    render(<PageHero icon="🌿" title="Test" subtitle="A subtitle" />);
    expect(screen.getByText("🌿")).toBeInTheDocument();
    expect(screen.getByText("A subtitle")).toBeInTheDocument();
  });

  it("omits subtitle when not provided", () => {
    render(<PageHero title="Bare" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});

// --- GradeBadge ---
import GradeBadge from "../components/GradeBadge";

describe("GradeBadge", () => {
  it("renders the score value", () => {
    render(<GradeBadge score={7.5} color="green" />);
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });

  it("has an accessible aria-label with score and color", () => {
    render(<GradeBadge score={4} color="yellow" />);
    expect(
      screen.getByRole("img", { name: /GreenGrade score: 4 out of 10, rated yellow/i })
    ).toBeInTheDocument();
  });

  it("renders larger SVG in large size mode", () => {
    render(<GradeBadge score={8} color="green" size="large" />);
    const svg = screen.getByTestId("badge-svg");
    expect(svg).toHaveAttribute("width", "88");
    expect(svg).toHaveAttribute("height", "88");
  });

  it("renders normal SVG by default", () => {
    render(<GradeBadge score={3} color="red" />);
    const svg = screen.getByTestId("badge-svg");
    expect(svg).toHaveAttribute("width", "48");
  });
});
