import { screen, within, fireEvent } from "@testing-library/react";
import ProductDetail from "../product/[id]/ProductDetailClient";
import {
  fetchProduct,
  fetchRecommendations,
  fetchProductEvidence,
  logCarbonPurchase,
} from "@/services/api";
import { renderWithQuery } from "./renderWithQuery";
// Real API responses. backend/__tests__/frontendContract.test.js fails if
// the API stops returning exactly these.
import tofu from "@/__fixtures__/api/product-12.json";
import beef from "@/__fixtures__/api/product-2.json";

let mockId = "12";
let mockAuthenticated = false;
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: mockId }),
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: mockAuthenticated }),
}));
jest.mock("@/services/api", () => ({
  fetchProduct: jest.fn(),
  fetchRecommendations: jest.fn(),
  fetchProductEvidence: jest.fn(),
  submitProductEvidence: jest.fn(),
  logCarbonPurchase: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

const heading = (p) => `${p.brand} ${p.name}`;

async function renderProduct(id, response) {
  mockId = id;
  fetchProduct.mockResolvedValueOnce(response);
  renderWithQuery(<ProductDetail />);
  await screen.findByRole("heading", { name: heading(response) });
}

// Stats for Nerds rows are a label span followed by a value span.
function statValue(label) {
  if (!screen.queryByRole("heading", { name: "Detailed Stats" })) {
    fireEvent.click(screen.getByRole("button", { name: "Stats for Nerds" }));
  }
  const section = screen.getByRole("heading", { name: "Detailed Stats" }).parentElement;
  const cell = within(section).queryByText(label, { selector: "span" });
  return cell ? cell.nextElementSibling.textContent : null;
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockAuthenticated = false;
  fetchRecommendations.mockResolvedValue({ recommendations: [] });
  fetchProductEvidence.mockResolvedValue({ evidence: [] });
});

describe("Product page", () => {
  test("shows a loading message before the product arrives", () => {
    fetchProduct.mockReturnValueOnce(new Promise(() => {}));
    renderWithQuery(<ProductDetail />);
    expect(screen.getByText("Loading product...")).toBeInTheDocument();
  });

  test("requests the product in the URL", async () => {
    await renderProduct("12", tofu);
    expect(fetchProduct).toHaveBeenCalledWith("12");
  });

  test("shows the API's GreenGrade score", async () => {
    await renderProduct("12", tofu);
    expect(screen.getByTestId("greengrade-score")).toHaveTextContent(String(tofu.greenGrade.score));
    expect(statValue("Overall Score")).toBe(`${tofu.greenGrade.score} / 10`);
  });

  test("shows each supply chain stage with the API's stage score", async () => {
    await renderProduct("12", tofu);
    const label = { Farm: "Farming" };
    for (const b of tofu.greenGrade.breakdown) {
      const name = screen.getAllByText(label[b.category] || b.category)[0];
      expect(name.nextElementSibling).toHaveTextContent(String(b.categoryScore));
    }
  });

  test("formats percentile and category rank as Top N%", async () => {
    expect(tofu.greenGrade.percentile).toBe(76);
    expect(tofu.greenGrade.categoryRank).toBe(88);
    await renderProduct("12", tofu);
    expect(statValue("Percentile")).toBe("Top 24%");
    expect(statValue("Category Rank")).toBe("Top 12%");
  });

  test("the lowest scoring product reads Top 100%, never a negative or 0%", async () => {
    expect(beef.greenGrade.percentile).toBe(0);
    await renderProduct("2", beef);
    expect(statValue("Percentile")).toBe("Top 100%");
    expect(statValue("Category Rank")).toBe("Top 99%");
    expect(document.body.textContent).not.toMatch(/Top -|Top 0%|NaN|Infinity/);
  });

  test("hides the percentile rows when the API leaves them out", async () => {
    const greenGrade = { ...tofu.greenGrade };
    delete greenGrade.percentile;
    delete greenGrade.categoryRank;
    await renderProduct("12", { ...tofu, greenGrade });
    expect(statValue("Percentile")).toBeNull();
    expect(statValue("Category Rank")).toBeNull();
  });

  test("the verdict follows the score", async () => {
    await renderProduct("12", tofu);
    expect(screen.getByText("This Product is Highly Sustainable")).toBeInTheDocument();
  });

  test("the verdict for a low score says so", async () => {
    await renderProduct("2", beef);
    expect(screen.getByText("This Product is Extremely Unsustainable")).toBeInTheDocument();
  });

  test("shows the estimate notice naming the brand", async () => {
    await renderProduct("12", tofu);
    expect(screen.getByRole("note")).toHaveTextContent(`supplied by, ${tofu.brand}.`);
  });

  test("links to the seller and to the passport for the same product", async () => {
    await renderProduct("12", tofu);
    expect(screen.getByRole("link", { name: "Click to Buy" })).toHaveAttribute(
      "href",
      tofu.purchaseLinks[0].url
    );
    const passportLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/passport/12");
    expect(passportLinks.length).toBeGreaterThan(0);
  });

  test("similar products show their own API scores", async () => {
    fetchRecommendations.mockReset();
    fetchRecommendations.mockResolvedValueOnce({
      category: "Protein",
      recommendations: [{ ...beef, id: "2" }],
    });
    await renderProduct("12", tofu);
    await screen.findByText("Similar Protein Products");
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === "/product/2");
    expect(link).toHaveTextContent(beef.name);
    expect(link).toHaveTextContent(String(beef.greenGrade.score));
  });

  test("shows an error and a way home when the request fails", async () => {
    fetchProduct.mockRejectedValueOnce(new Error("Product not found"));
    renderWithQuery(<ProductDetail />);
    expect(await screen.findByText("Unable to load product details.")).toBeInTheDocument();
    expect(screen.queryByTestId("greengrade-score")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to Home" }));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  describe("logging a purchase (products with no seller link)", () => {
    const noLink = { ...tofu, purchaseLinks: [] };

    test("is hidden from signed out users", async () => {
      await renderProduct("12", noLink);
      expect(screen.queryByRole("button", { name: "Log Purchase" })).not.toBeInTheDocument();
    });

    test("logs the API's total emissions for this product", async () => {
      mockAuthenticated = true;
      logCarbonPurchase.mockResolvedValueOnce({});
      await renderProduct("12", noLink);
      fireEvent.click(screen.getByRole("button", { name: "Log Purchase" }));
      expect(
        await screen.findByRole("button", { name: /Logged to Carbon Tracker/ })
      ).toBeDisabled();
      expect(logCarbonPurchase).toHaveBeenCalledWith(
        "12",
        tofu.name,
        1,
        tofu.greenGrade.totalEmissions
      );
    });

    test("shows the API error when logging fails", async () => {
      mockAuthenticated = true;
      logCarbonPurchase.mockRejectedValueOnce(new Error("Session expired"));
      await renderProduct("12", noLink);
      fireEvent.click(screen.getByRole("button", { name: "Log Purchase" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Session expired");
      expect(screen.getByRole("button", { name: "Log Purchase" })).toBeEnabled();
    });
  });
});
