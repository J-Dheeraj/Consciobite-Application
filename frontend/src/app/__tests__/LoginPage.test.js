import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../login/page";
import { loginUser } from "@/services/api";

const mockPush = jest.fn();
const mockLogin = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/context/ThemeContext", () => ({ useTheme: () => ({ theme: "light" }) }));
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ login: mockLogin }) }));
jest.mock("@/services/api", () => ({ loginUser: jest.fn() }));

function fillAndSubmit(email = "dana@example.com", password = "correct horse") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

beforeEach(() => jest.clearAllMocks());

describe("Login page", () => {
  test("renders the form with required email and password fields", () => {
    render(<Login />);
    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("signs in with what was typed, stores the session and goes home", async () => {
    const response = {
      user: { id: 1, email: "dana@example.com" },
      token: "jwt",
      expiresAt: "2030-01-01T00:00:00.000Z",
    };
    loginUser.mockResolvedValueOnce(response);
    render(<Login />);
    fillAndSubmit();
    await screen.findByRole("button", { name: "Sign In" });
    expect(loginUser).toHaveBeenCalledWith("dana@example.com", "correct horse");
    expect(mockLogin).toHaveBeenCalledWith(response.user, response.token, response.expiresAt);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  test("disables the button while the request is in flight", async () => {
    let resolve;
    loginUser.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    render(<Login />);
    fillAndSubmit();
    expect(await screen.findByRole("button", { name: "Signing in..." })).toBeDisabled();
    resolve({ user: {}, token: "t", expiresAt: null });
    expect(await screen.findByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  test("shows the API's error, stays on the page and lets the user retry", async () => {
    loginUser.mockRejectedValueOnce(new Error("Invalid email or password"));
    render(<Login />);
    fillAndSubmit();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Invalid email or password");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "login-error");
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("shows the lockout message after too many attempts", async () => {
    // The exact 429 body backend/src/routes/auth.js sends after 5 failures.
    loginUser.mockRejectedValueOnce(new Error("Too many failed attempts. Please try again later."));
    render(<Login />);
    fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many failed attempts. Please try again later."
    );
  });

  test("falls back to a generic message when the error has none", async () => {
    loginUser.mockRejectedValueOnce(new Error(""));
    render(<Login />);
    fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Login failed");
  });

  test("clears the old error on the next attempt", async () => {
    loginUser.mockRejectedValueOnce(new Error("Invalid email or password"));
    render(<Login />);
    fillAndSubmit();
    await screen.findByRole("alert");
    loginUser.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
