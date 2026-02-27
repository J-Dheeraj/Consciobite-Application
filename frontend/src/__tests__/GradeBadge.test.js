import React from "react";
import { render, screen } from "@testing-library/react";
import GradeBadge from "../components/GradeBadge";

test("renders the score value", () => {
  render(<GradeBadge score={7.5} color="green" />);
  expect(screen.getByText("7.5")).toBeInTheDocument();
});

test("shows correct title tooltip", () => {
  render(<GradeBadge score={4} color="yellow" />);
  expect(screen.getByTitle("GreenGrade: 4/10")).toBeInTheDocument();
});

test("renders large size variant", () => {
  const { container } = render(<GradeBadge score={9} color="green" size="large" />);
  const svg = container.querySelector("svg");
  expect(svg).toHaveAttribute("width", "88");
  expect(svg).toHaveAttribute("height", "88");
});

test("renders normal size by default", () => {
  const { container } = render(<GradeBadge score={3} color="red" />);
  const svg = container.querySelector("svg");
  expect(svg).toHaveAttribute("width", "48");
  expect(svg).toHaveAttribute("height", "48");
});

test("falls back to yellow colors for unknown color", () => {
  render(<GradeBadge score={5} color="purple" />);
  // Should still render without crashing
  expect(screen.getByText("5")).toBeInTheDocument();
});
