import { render, screen } from "@testing-library/react";
import GradeBadge from "../GradeBadge";

describe("GradeBadge", () => {
  test("renders the score with an accessible label", () => {
    render(<GradeBadge score={8.5} color="green" />);
    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "GreenGrade score: 8.5 out of 10, rated green" })
    ).toBeInTheDocument();
  });

  test("falls back to yellow styling for an unknown color", () => {
    render(<GradeBadge score={5} color="yellow" />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByTestId("badge-svg")).toBeInTheDocument();
  });
});
