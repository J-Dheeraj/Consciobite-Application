import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../ThemeContext";

function ThemeLabel() {
  const { theme } = useTheme();
  return <span data-testid="theme">{theme}</span>;
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  // Prerendered HTML is always light. If the first client render read the
  // stored preference, dark-mode visitors would hit a hydration mismatch.
  it("renders light first, then applies the stored dark preference after mount", async () => {
    localStorage.setItem("consciobite_theme", "dark");
    const seen = [];
    function Spy() {
      const { theme } = useTheme();
      seen.push(theme);
      return null;
    }
    render(
      <ThemeProvider>
        <Spy />
        <ThemeLabel />
      </ThemeProvider>
    );
    expect(seen[0]).toBe("light");
    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("consciobite_theme")).toBe("dark");
  });

  it("does not overwrite the stored preference with the initial light render", async () => {
    localStorage.setItem("consciobite_theme", "dark");
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    render(
      <ThemeProvider>
        <ThemeLabel />
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent("dark"));
    expect(setItem).not.toHaveBeenCalledWith("consciobite_theme", "light");
    setItem.mockRestore();
  });
});
