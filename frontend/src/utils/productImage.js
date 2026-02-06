// Category-specific colors for placeholder images (bg, text)
const CATEGORY_COLORS = {
  Protein: ["e8d5d5", "8b4513"],
  Seafood: ["d5e8f0", "1e5f74"],
  "Dairy & Eggs": ["fff8dc", "b8860b"],
  Grains: ["f5e6d3", "8b7355"],
  Fruits: ["e8f5e9", "2e7d32"],
  Vegetables: ["c8e6c9", "1b5e20"],
  Beverages: ["e0f7fa", "00695c"],
  Snacks: ["fff3e0", "e65100"],
  Pantry: ["efebe9", "5d4037"],
};

const DEFAULT_COLORS = ["f5f5f5", "666666"];

/**
 * Get the image URL for a product.
 * If the product has an `image` field, use that.
 * Otherwise, generate a placeholder based on category and name.
 */
export function getProductImage(product, size = 200) {
  // Use product's own image if available
  if (product.image) {
    return product.image;
  }

  // Generate placeholder image
  const colors = CATEGORY_COLORS[product.category] || DEFAULT_COLORS;
  const [bgColor, textColor] = colors;

  // Use first two words of name for placeholder text
  const words = product.name.split(" ").slice(0, 2).join("+");
  const text = encodeURIComponent(words);

  return `https://placehold.co/${size}x${size}/${bgColor}/${textColor}?text=${text}&font=roboto`;
}

/**
 * Get a larger image for detail view
 */
export function getProductImageLarge(product) {
  return getProductImage(product, 400);
}
