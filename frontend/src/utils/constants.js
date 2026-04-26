export const CATEGORY_ICONS = {
  Protein: "\uD83E\uDD69",
  Seafood: "\uD83D\uDC1F",
  "Dairy & Eggs": "\uD83E\uDD5B",
  Grains: "\uD83C\uDF3E",
  Fruits: "\uD83C\uDF53",
  Vegetables: "\uD83E\uDD66",
  Beverages: "\uD83E\uDDC3",
  Snacks: "\uD83C\uDF6A",
  Pantry: "\uD83C\uDF6F",
};

export const scoreColor = (score) => {
  if (score >= 7) return "#27ae60";
  if (score >= 4) return "#f39c12";
  return "#e74c3c";
};

export const WEEKLY_CARBON_GOAL_KG = 10;

export const AUTH_EXPIRED_EVENT = "auth-expired";
