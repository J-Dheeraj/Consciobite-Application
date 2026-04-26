export const CATEGORY_ICONS: Record<string, string> = {
  Protein: "🥩",
  Seafood: "🐟",
  "Dairy & Eggs": "🥛",
  Grains: "🌾",
  Fruits: "🍓",
  Vegetables: "🥦",
  Beverages: "🧃",
  Snacks: "🍪",
  Pantry: "🍯",
};

export function scoreColor(score: number): string {
  if (score >= 7) return "#27ae60";
  if (score >= 4) return "#f39c12";
  return "#e74c3c";
}

export const WEEKLY_CARBON_GOAL_KG = 10;

export const AUTH_EXPIRED_EVENT = "auth-expired";
