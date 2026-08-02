import { render, screen } from "@testing-library/react";
import GradeBreakdown from "../GradeBreakdown";

const BREAKDOWN = [
  { category: "Land Use Change", categoryScore: 8, emission: 0.5, maxReference: 2 },
  { category: "Farm", categoryScore: 5, emission: 1.2, maxReference: 3 },
  { category: "Transport", categoryScore: 9, emission: 0.1, maxReference: 1 },
];

describe("GradeBreakdown", () => {
  test("renders all supply-chain category names", () => {
    render(<GradeBreakdown breakdown={BREAKDOWN} totalEmissions={1.8} totalScore={7.3} />);
    expect(screen.getAllByText("Land Use Change").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Farm").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transport").length).toBeGreaterThan(0);
  });

  test("displays the provided totalScore", () => {
    render(<GradeBreakdown breakdown={BREAKDOWN} totalEmissions={1.8} totalScore={7.3} />);
    expect(screen.getAllByText("7.3").length).toBeGreaterThan(0);
  });

  test("displays the total emissions", () => {
    render(<GradeBreakdown breakdown={BREAKDOWN} totalEmissions={1.8} totalScore={7.3} />);
    expect(screen.getByText(/1\.8 kg CO/)).toBeInTheDocument();
  });

  test("shows Low Impact label for scores ≥ 7", () => {
    render(<GradeBreakdown breakdown={BREAKDOWN} totalEmissions={1.8} totalScore={7.3} />);
    // scores 8 and 9 both → Low Impact
    expect(screen.getAllByText("Low Impact").length).toBeGreaterThanOrEqual(2);
  });

  test("shows Moderate label for scores between 4 and 7", () => {
    render(<GradeBreakdown breakdown={BREAKDOWN} totalEmissions={1.8} totalScore={7.3} />);
    expect(screen.getByText("Moderate")).toBeInTheDocument();
  });

  test("shows High Impact label for scores below 4", () => {
    const lowBreakdown = [
      { category: "Packaging", categoryScore: 2, emission: 3.5, maxReference: 4 },
    ];
    render(<GradeBreakdown breakdown={lowBreakdown} totalEmissions={3.5} totalScore={2.0} />);
    expect(screen.getByText("High Impact")).toBeInTheDocument();
  });

  test("displays category score values in the card circles", () => {
    render(<GradeBreakdown breakdown={BREAKDOWN} totalEmissions={1.8} totalScore={7.3} />);
    expect(screen.getAllByTitle(/land use change score: 8/i).length).toBeGreaterThan(0);
    expect(screen.getAllByTitle(/farm score: 5/i).length).toBeGreaterThan(0);
    expect(screen.getAllByTitle(/transport score: 9/i).length).toBeGreaterThan(0);
  });

  test("shows Total GreenGrade heading", () => {
    render(<GradeBreakdown breakdown={BREAKDOWN} totalEmissions={1.8} totalScore={7.3} />);
    expect(screen.getByText("Total GreenGrade")).toBeInTheDocument();
  });
});
