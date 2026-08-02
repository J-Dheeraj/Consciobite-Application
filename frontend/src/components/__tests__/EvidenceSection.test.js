import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: false })),
}));

jest.mock("@/services/api", () => ({
  fetchProductEvidence: jest.fn(() => Promise.resolve({ evidence: [] })),
  submitProductEvidence: jest.fn(() => Promise.resolve({})),
}));

jest.mock("next/link", () => {
  return function MockLink({ href, children }) {
    return <a href={href}>{children}</a>;
  };
});

const EvidenceSection = require("../EvidenceSection").default;

describe("EvidenceSection", () => {
  afterEach(() => jest.clearAllMocks());

  test("shows empty state for anonymous user", async () => {
    render(<EvidenceSection productId="prod-1" />);
    await waitFor(() =>
      expect(screen.getByText(/no community evidence yet/i)).toBeInTheDocument()
    );
  });

  test("shows sign-in link for anonymous user", async () => {
    render(<EvidenceSection productId="prod-1" />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /sign in to submit/i })).toBeInTheDocument()
    );
  });

  test("shows Submit Evidence button for authenticated user", async () => {
    const { useAuth } = require("@/context/AuthContext");
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<EvidenceSection productId="prod-1" />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit evidence/i })).toBeInTheDocument()
    );
  });

  test("shows submission form when Submit Evidence is clicked", async () => {
    const { useAuth } = require("@/context/AuthContext");
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<EvidenceSection productId="prod-1" />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit evidence/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /submit evidence/i }));
    expect(
      screen.getByPlaceholderText(/author\(s\), year\. title/i)
    ).toBeInTheDocument();
  });

  test("shows validation error for a too-short citation", async () => {
    const { useAuth } = require("@/context/AuthContext");
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<EvidenceSection productId="prod-1" />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit evidence/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /submit evidence/i }));
    // Click submit without filling citation
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/citation must be at least 20 characters/i)
      ).toBeInTheDocument()
    );
  });

  test("cancels form on Cancel click", async () => {
    const { useAuth } = require("@/context/AuthContext");
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<EvidenceSection productId="prod-1" />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit evidence/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /submit evidence/i }));
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    // Form is gone; Submit Evidence button reappears
    expect(
      screen.getByRole("button", { name: /submit evidence/i })
    ).toBeInTheDocument();
  });

  test("renders approved evidence items", async () => {
    const { fetchProductEvidence } = require("@/services/api");
    fetchProductEvidence.mockResolvedValue({
      evidence: [
        {
          id: "ev-1",
          citation: "Poore & Nemecek 2018 — Science paper on food system emissions",
          source_type: "peer_reviewed_lca",
          submitted_at: "2026-01-15T00:00:00Z",
        },
      ],
    });
    render(<EvidenceSection productId="prod-1" />);
    await waitFor(() =>
      expect(
        screen.getByText("Poore & Nemecek 2018 — Science paper on food system emissions")
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Peer-Reviewed LCA")).toBeInTheDocument();
  });

  test("fetches evidence for the given productId", async () => {
    const { fetchProductEvidence } = require("@/services/api");
    render(<EvidenceSection productId="prod-99" />);
    await waitFor(() => expect(fetchProductEvidence).toHaveBeenCalledWith("prod-99"));
  });
});
