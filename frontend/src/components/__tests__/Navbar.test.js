import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/context/ThemeContext", () => ({
  useTheme: jest.fn(() => ({ theme: "light", toggleTheme: jest.fn() })),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: false, user: null, logout: jest.fn() })),
}));

// Import after mocks are registered
const Navbar = require("../Navbar").default;

describe("Navbar", () => {
  afterEach(() => jest.clearAllMocks());

  test("renders the brand link", () => {
    render(<Navbar />);
    expect(screen.getByText("Consciobite")).toBeInTheDocument();
  });

  test("renders Sign In link when not authenticated", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  test("renders all primary nav links", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /scan/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /compare/i })).toBeInTheDocument();
  });

  test("renders user first name and Logout button when authenticated", () => {
    const { useAuth } = require("@/context/AuthContext");
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Alice Smith" },
      logout: jest.fn(),
    });
    render(<Navbar />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getAllByRole("button").some((b) => /logout/i.test(b.textContent))).toBe(true);
  });

  test("calls logout and navigates to home on logout click", () => {
    const mockLogout = jest.fn();
    const mockPush = jest.fn();
    const { useAuth } = require("@/context/AuthContext");
    const { useRouter } = require("next/navigation");
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Alice Smith" },
      logout: mockLogout,
    });
    useRouter.mockReturnValue({ push: mockPush });
    render(<Navbar />);
    fireEvent.click(screen.getAllByRole("button").find((b) => /logout/i.test(b.textContent)));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  test("opens mobile menu on hamburger click", () => {
    render(<Navbar />);
    const hamburger = screen.getByRole("button", { name: /toggle menu/i });
    expect(hamburger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute("aria-expanded", "true");
  });

  test("closes mobile menu when clicked again", () => {
    render(<Navbar />);
    const hamburger = screen.getByRole("button", { name: /toggle menu/i });
    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute("aria-expanded", "false");
  });
});
