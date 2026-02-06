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
 * Priority:
 * 1. Product's own `image` field (if set in products.json)
 * 2. Local image file at /images/products/{id}.jpg
 * 3. Placeholder image based on category
 */
export function getProductImage(product, size = 200) {
  // 1. Use product's own image URL if available
  if (product.image) {
    return product.image;
  }

  // 2. Use local image (saved in public/images/products/)
  // These will be checked at runtime - if the image exists, it loads; otherwise shows placeholder
  return `/images/products/${product.id}.jpg`;
}

/**
 * Get a larger image for detail view
 */
export function getProductImageLarge(product) {
  return getProductImage(product, 400);
}

/**
 * Get placeholder image URL (fallback)
 */
export function getPlaceholderImage(product, size = 200) {
  const colors = CATEGORY_COLORS[product.category] || DEFAULT_COLORS;
  const [bgColor, textColor] = colors;
  const words = product.name.split(" ").slice(0, 2).join("+");
  const text = encodeURIComponent(words);
  return `https://placehold.co/${size}x${size}/${bgColor}/${textColor}?text=${text}&font=roboto`;
}
