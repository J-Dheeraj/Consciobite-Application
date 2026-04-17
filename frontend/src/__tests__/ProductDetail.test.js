import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import ProductDetail from "../pages/ProductDetail";

// Minimal product shape ProductDetail needs for its top-of-page render.
const mockOffProduct = {
  id: "off_1234567890123",
  name: "Seeded Test Snack",
  brand: "TestBrand",
  category: "Snacks",
  description: "Seeded from scan navigation state.",
  barcode: "1234567890123",
  source: "openfoodfacts",
  emissions: {
    landUseChange: 0.5,
    animalFeed: 0.3,
    farm: 1,
    processing: 1,
    transport: 0.4,
    packaging: 0.5,
    retail: 0.3,
  },
  greenGrade: {
    score: 6.2,
    color: "#f39c12",
    totalEmissions: 4.0,
    breakdown: [],
  },
};

function renderWithSeed(productState) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter
      initialEntries={[
        { pathname: `/product/${mockOffProduct.id}`, state: { product: productState } },
      ]}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/product/:id" element={<ProductDetail />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  // Keep fetch defined so useQuery's background refetch doesn't blow up, but
  // the component should render from initialData before fetch resolves.
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(mockOffProduct) })
  );
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders product synchronously when seeded via navigation state", () => {
  renderWithSeed(mockOffProduct);
  // No loading spinner — initialData short-circuits the useQuery pending state.
  expect(screen.queryByText(/Loading product/i)).not.toBeInTheDocument();
  // The seeded product's brand+name shows up right away.
  expect(screen.getByText(/TestBrand/)).toBeInTheDocument();
  expect(screen.getByText(/Seeded Test Snack/)).toBeInTheDocument();
});

test("ignores seed state when id does not match route param", () => {
  // Seed carries a different id than the URL's :id — should fall through to
  // the normal loading path (no initialData applied).
  renderWithSeed({ ...mockOffProduct, id: "off_9999999999999" });
  expect(screen.queryByText(/Seeded Test Snack/)).not.toBeInTheDocument();
});
