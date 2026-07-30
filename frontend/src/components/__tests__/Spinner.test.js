import { render, screen } from "@testing-library/react";
import Spinner from "../Spinner";

describe("Spinner", () => {
  test("renders default loading message", () => {
    render(<Spinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders a custom message", () => {
    render(<Spinner message="Fetching products..." />);
    expect(screen.getByText("Fetching products...")).toBeInTheDocument();
  });
});
