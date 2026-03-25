import React from "react";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test("defaults to light theme when no preference stored", () => {
  render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );
  expect(screen.getByTestId("theme")).toHaveTextContent("light");
});

test("restores theme from localStorage", () => {
  localStorage.setItem("consciobite_theme", "dark");

  render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );
  expect(screen.getByTestId("theme")).toHaveTextContent("dark");
});

test("toggleTheme switches between light and dark", () => {
  render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );

  expect(screen.getByTestId("theme")).toHaveTextContent("light");

  act(() => {
    screen.getByText("Toggle").click();
  });
  expect(screen.getByTestId("theme")).toHaveTextContent("dark");

  act(() => {
    screen.getByText("Toggle").click();
  });
  expect(screen.getByTestId("theme")).toHaveTextContent("light");
});

test("sets data-theme attribute on document element", () => {
  render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");

  act(() => {
    screen.getByText("Toggle").click();
  });
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
});

test("persists theme to localStorage", () => {
  render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );

  act(() => {
    screen.getByText("Toggle").click();
  });
  expect(localStorage.getItem("consciobite_theme")).toBe("dark");
});
