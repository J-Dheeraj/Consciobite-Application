import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "../ProductCard";

jest.mock("next/link", () => {
  return function MockLink({ href, children, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("@/components/GradeBadge", () => {
  return function MockGradeBadge({ score }) {
    return <div data-testid="grade-badge">{score}</div>;
  };
});

jest.mock("@/components/ProductImage", () => {
  return function MockProductImage() {
    return <div data-testid="product-image" />;
  };
});

jest.mock("@/utils/favorites", () => ({
  isFavorited: jest.fn(() => false),
  toggleFavorite: jest.fn(() => true),
}));

const PRODUCT = {
  id: "prod-42",
  name: "Oat Milk Original",
  brand: "Oatly",
  category: "Beverages",
  greenGrade: { score: 8.2, color: "green", totalEmissions: 1.2 },
};

describe("ProductCard", () => {
  afterEach(() => jest.clearAllMocks());

  test("renders product name, brand, and category", () => {
    render(<ProductCard product={PRODUCT} />);
    expect(screen.getByText("Oat Milk Original")).toBeInTheDocument();
    expect(screen.getByText("Oatly")).toBeInTheDocument();
    expect(screen.getByText("Beverages")).toBeInTheDocument();
  });

  test("links to the product detail page", () => {
    render(<ProductCard product={PRODUCT} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/product/prod-42");
  });

  test("renders emissions value", () => {
    render(<ProductCard product={PRODUCT} />);
    expect(screen.getByText("1.2")).toBeInTheDocument();
  });

  test("renders the GradeBadge with the correct score", () => {
    render(<ProductCard product={PRODUCT} />);
    expect(screen.getByTestId("grade-badge")).toHaveTextContent("8.2");
  });

  test("renders the favorites button as unfavorited by default", () => {
    render(<ProductCard product={PRODUCT} />);
    expect(
      screen.getByRole("button", { name: /add to favorites/i })
    ).toBeInTheDocument();
  });

  test("calls toggleFavorite with the product id on button click", () => {
    const { toggleFavorite } = require("@/utils/favorites");
    render(<ProductCard product={PRODUCT} />);
    fireEvent.click(screen.getByRole("button", { name: /add to favorites/i }));
    expect(toggleFavorite).toHaveBeenCalledWith("prod-42");
  });

  test("renders as favorited when isFavorited returns true", () => {
    const { isFavorited } = require("@/utils/favorites");
    isFavorited.mockReturnValue(true);
    render(<ProductCard product={PRODUCT} />);
    expect(
      screen.getByRole("button", { name: /remove from favorites/i })
    ).toBeInTheDocument();
  });
});
