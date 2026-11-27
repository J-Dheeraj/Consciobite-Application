import { screen, within } from "@testing-library/react";
import PassportClient from "../passport/[id]/PassportClient";
import { fetchPassport } from "@/services/api";
import { renderWithQuery } from "./renderWithQuery";
// Real API responses. backend/__tests__/frontendContract.test.js fails if
// the API stops returning exactly these.
import tofuPassport from "@/__fixtures__/api/passport-12.json";
import beefPassport from "@/__fixtures__/api/passport-2.json";

let mockId = "12";
jest.mock("next/navigation", () => ({ useParams: () => ({ id: mockId }) }));
jest.mock("@/context/ThemeContext", () => ({ useTheme: () => ({ theme: "light" }) }));
jest.mock("@/services/api", () => ({ fetchPassport: jest.fn() }));

// The summary tiles are a label div followed by a value div.
function tileValue(label) {
  return screen.getByText(label).nextElementSibling.textContent;
}

async function renderPassport(id, response) {
  mockId = id;
  fetchPassport.mockResolvedValueOnce(response);
  renderWithQuery(<PassportClient />);
  await screen.findByRole("heading", { name: response.product_name });
}

beforeEach(() => fetchPassport.mockReset());

describe("Passport page", () => {
  test("shows a loading message before the passport arrives", () => {
    fetchPassport.mockReturnValueOnce(new Promise(() => {}));
    renderWithQuery(<PassportClient />);
    expect(screen.getByText("Loading passport...")).toBeInTheDocument();
  });

  test("requests the passport for the product in the URL", async () => {
    await renderPassport("12", tofuPassport);
    expect(fetchPassport).toHaveBeenCalledWith("12");
  });

  test("shows the API's score in the ring and the summary tile", async () => {
    await renderPassport("12", tofuPassport);
    expect(screen.getByTestId("greengrade-score")).toHaveTextContent(
      String(tofuPassport.greengrade_score)
    );
    expect(tileValue("GreenGrade Score")).toBe(`${tofuPassport.greengrade_score} / 10`);
  });

  test("formats the API percentile as Top N% (76 is Top 24%)", async () => {
    expect(tofuPassport.score_percentile).toBe(76);
    await renderPassport("12", tofuPassport);
    expect(tileValue("Percentile")).toBe("Top 24%");
  });

  test("the lowest scoring product reads Top 100%, never a negative or 0%", async () => {
    expect(beefPassport.score_percentile).toBe(0);
    await renderPassport("2", beefPassport);
    expect(tileValue("Percentile")).toBe("Top 100%");
    expect(document.body.textContent).not.toMatch(/Top -|NaN|Infinity/);
  });

  test("shows N/A when the API has no percentile", async () => {
    await renderPassport("12", { ...tofuPassport, score_percentile: null });
    expect(tileValue("Percentile")).toBe("N/A");
  });

  test("shows total CO2e, methodology version and brand", async () => {
    await renderPassport("12", tofuPassport);
    expect(tileValue("Total CO₂e")).toBe(
      `${tofuPassport.total_carbon_footprint_kg_co2e.toFixed(3)} kg/kg`
    );
    expect(tileValue("Methodology")).toBe(`v${tofuPassport.methodology_version}`);
    expect(
      screen.getByText(`${tofuPassport.brand} · ${tofuPassport.category}`)
    ).toBeInTheDocument();
  });

  test("lists all seven emission stages with the API's values", async () => {
    await renderPassport("12", tofuPassport);
    const section = screen.getByText("7-Dimension Emission Breakdown").parentElement;
    const labels = {
      land_use_change: "Land Use Change",
      animal_feed: "Animal Feed",
      farm_operations: "Farming",
      processing: "Processing",
      transport: "Transport",
      packaging: "Packaging",
      retail: "Retail",
    };
    for (const [key, label] of Object.entries(labels)) {
      const row = within(section).getByText(label).parentElement;
      expect(row).toHaveTextContent(`${tofuPassport.emission_breakdown[key].toFixed(3)} kg CO₂e`);
    }
  });

  test("shows the data confidence tier", async () => {
    await renderPassport("12", tofuPassport);
    expect(screen.getByText("Tier 1 — Verified LCA")).toBeInTheDocument();
  });

  test("links back to the same product", async () => {
    await renderPassport("12", tofuPassport);
    expect(screen.getByRole("link", { name: "Full Product Details" })).toHaveAttribute(
      "href",
      "/product/12"
    );
  });

  test("shows an error and a way out when the request fails", async () => {
    fetchPassport.mockRejectedValueOnce(new Error("Product not found"));
    renderWithQuery(<PassportClient />);
    expect(
      await screen.findByText("Unable to load passport for this product.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Browse products/ })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.queryByTestId("greengrade-score")).not.toBeInTheDocument();
  });
});
