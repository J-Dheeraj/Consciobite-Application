import { render, screen } from "@testing-library/react";
import EstimateNotice from "../EstimateNotice";

describe("EstimateNotice", () => {
  test("says the score is an estimate and names the brand it does not come from", () => {
    render(<EstimateNotice brand="Unicurd" />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/estimate/i);
    expect(note).toHaveTextContent(/published research/i);
    expect(note).toHaveTextContent("Not measured from, or supplied by, Unicurd.");
  });

  test("still reads correctly when the brand is unknown", () => {
    render(<EstimateNotice />);
    expect(screen.getByRole("note")).toHaveTextContent("supplied by, the brand.");
  });
});
