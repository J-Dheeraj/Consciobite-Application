import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Portfolio from "../portfolio/page";

jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

jest.mock("../../services/api", () => ({
  fetchProducts: jest.fn(),
  fetchPortfolioScore: jest.fn(),
}));

jest.mock("next/link", () => {
  const MockLink = ({ href, children, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

const { fetchProducts, fetchPortfolioScore } = require("../../services/api");

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Oat Milk",
    brand: "Oatly",
    category: "Beverages",
    greenGrade: { score: 8.2 },
  },
  {
    id: "2",
    name: "Beef Burger",
    brand: "Angus",
    category: "Protein",
    greenGrade: { score: 1.4 },
  },
];

function wrap(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("Portfolio page", () => {
  beforeEach(() => {
    fetchProducts.mockResolvedValue({ products: MOCK_PRODUCTS });
    fetchPortfolioScore.mockResolvedValue({
      products: [
        {
          product_id: "1",
          product_name: "Oat Milk",
          brand: "Oatly",
          category: "Beverages",
          greengrade_score: 8.2,
          total_carbon_footprint_kg_co2e: 0.9,
        },
      ],
      portfolio_summary: {
        average_score: 8.2,
        product_count: 1,
        highest: { id: "1", name: "Oat Milk", score: 8.2 },
        lowest: { id: "1", name: "Oat Milk", score: 8.2 },
      },
      category_benchmarks: [
        { category: "Beverages", count: 1, avg_score: 8.2, avg_emissions: 0.9 },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the hero heading", async () => {
    wrap(<Portfolio />);
    expect(screen.getByText("Portfolio Scorer")).toBeInTheDocument();
    await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  });

  test("shows search input", async () => {
    wrap(<Portfolio />);
    expect(screen.getByRole("textbox", { name: /search products for portfolio/i })).toBeInTheDocument();
    await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  });

  test("score button is disabled with no products selected", async () => {
    wrap(<Portfolio />);
    const btn = screen.getByRole("button", { name: /score portfolio/i });
    expect(btn).toBeDisabled();
    await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  });

  test("loads and shows products in the list", async () => {
    wrap(<Portfolio />);
    await waitFor(() => expect(screen.getByText("Oat Milk")).toBeInTheDocument());
    expect(screen.getByText("Beef Burger")).toBeInTheDocument();
  });

  test("selecting a product enables the score button", async () => {
    wrap(<Portfolio />);
    await waitFor(() => expect(screen.getByText("Oat Milk")).toBeInTheDocument());

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    const btn = screen.getByRole("button", { name: /score portfolio \(1\)/i });
    expect(btn).not.toBeDisabled();
  });

  test("clear all button appears after selection", async () => {
    wrap(<Portfolio />);
    await waitFor(() => expect(screen.getByText("Oat Milk")).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });
});
