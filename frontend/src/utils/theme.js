export const THEME_DARK = "dark";

export function themeColors(isDark) {
  return {
    textPrimary: isDark ? "#e8f5e9" : "inherit",
    textSecondary: isDark ? "#b0c4b1" : "#555",
    textMuted: isDark ? "#7a9a7e" : "#888",
    border: isDark ? "#2d4a35" : "#eee",
    cardBg: isDark ? "#162419" : "#fff",
    cardBgAlt: isDark ? "#1c2e22" : "#edf7f0",
    heading: isDark ? "#e8f5e9" : "#1a3a2a",
    accent: isDark ? "#95d5b2" : "#2d6a4f",
  };
}
