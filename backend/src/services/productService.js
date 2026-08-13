const { randomBytes } = require("crypto");
const { getDb } = require("../db/schema");
const { calculateGreenGrade } = require("./greengrade");
const { invalidateCache: invalidateHttpCache } = require("../middleware/cache");

const REQUIRED_EMISSION_KEYS = [
  "landUseChange",
  "animalFeed",
  "farm",
  "processing",
  "transport",
  "packaging",
  "retail",
];

let _cache = null;

function _enrichFromRow(row) {
  const product = JSON.parse(row.product_data);
  const grade = calculateGreenGrade(product.emissions, product.category, product);
  return { ...product, greenGrade: grade };
}

function loadCache() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM catalog_products WHERE is_active = 1 ORDER BY CAST(id AS INTEGER), id")
    .all();
  _cache = rows.map(_enrichFromRow);
}

function seedFromJson(productsJson) {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM catalog_products").get().c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO catalog_products (id, name, brand, category, barcode, source, product_data)
    VALUES (?, ?, ?, ?, ?, 'catalog', ?)
  `);

  const seedAll = db.transaction((products) => {
    for (const p of products) {
      insert.run(
        String(p.id),
        p.name,
        p.brand,
        p.category,
        p.barcode || null,
        JSON.stringify(p)
      );
    }
  });

  seedAll(productsJson);
}

function getAllProducts() {
  if (_cache === null) loadCache();
  return _cache;
}

function getProductById(id) {
  return getAllProducts().find((p) => String(p.id) === id) || null;
}

function getProductByBarcode(barcode) {
  return getAllProducts().find((p) => p.barcode === barcode) || null;
}

function validateEmissions(emissions) {
  if (!emissions || typeof emissions !== "object") {
    return "emissions must be an object";
  }
  for (const key of REQUIRED_EMISSION_KEYS) {
    if (typeof emissions[key] !== "number" || isNaN(emissions[key]) || emissions[key] < 0) {
      return `emissions.${key} must be a non-negative number`;
    }
  }
  return null;
}

function createProduct(data) {
  const { name, brand, category, emissions } = data;

  const emissionsError = validateEmissions(emissions);
  if (emissionsError) throw Object.assign(new Error(emissionsError), { isValidation: true });

  const id = "a" + randomBytes(4).toString("hex");
  const product = {
    id,
    name: String(name).trim(),
    brand: String(brand).trim(),
    category: String(category).trim(),
    barcode: data.barcode ? String(data.barcode).trim() : null,
    description: data.description ? String(data.description).trim() : null,
    purchaseLinks: Array.isArray(data.purchaseLinks) ? data.purchaseLinks : [],
    dataSources: data.dataSources || null,
    emissions,
  };

  const db = getDb();
  db.prepare(`
    INSERT INTO catalog_products (id, name, brand, category, barcode, source, product_data)
    VALUES (?, ?, ?, ?, ?, 'admin', ?)
  `).run(id, product.name, product.brand, product.category, product.barcode, JSON.stringify(product));

  loadCache();
  invalidateHttpCache("/products");
  return getProductById(id);
}

function updateProduct(id, data) {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM catalog_products WHERE id = ? AND is_active = 1")
    .get(id);
  if (!row) return null;

  const existing = JSON.parse(row.product_data);

  if (data.emissions !== undefined) {
    const emissionsError = validateEmissions(data.emissions);
    if (emissionsError) throw Object.assign(new Error(emissionsError), { isValidation: true });
  }

  const updated = {
    ...existing,
    ...(data.name !== undefined && { name: String(data.name).trim() }),
    ...(data.brand !== undefined && { brand: String(data.brand).trim() }),
    ...(data.category !== undefined && { category: String(data.category).trim() }),
    ...(data.description !== undefined && { description: String(data.description).trim() }),
    ...(data.barcode !== undefined && { barcode: data.barcode ? String(data.barcode).trim() : null }),
    ...(data.emissions !== undefined && { emissions: data.emissions }),
    ...(data.purchaseLinks !== undefined && { purchaseLinks: data.purchaseLinks }),
    ...(data.dataSources !== undefined && { dataSources: data.dataSources }),
  };

  db.prepare(`
    UPDATE catalog_products
    SET name = ?, brand = ?, category = ?, barcode = ?,
        product_data = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    updated.name,
    updated.brand,
    updated.category,
    updated.barcode || null,
    JSON.stringify(updated),
    id
  );

  loadCache();
  invalidateHttpCache("/products");
  return getProductById(id);
}

function softDeleteProduct(id) {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE catalog_products SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND is_active = 1"
    )
    .run(id);
  if (result.changes === 0) return false;
  loadCache();
  invalidateHttpCache("/products");
  return true;
}

function invalidateCache() {
  _cache = null;
}

module.exports = {
  seedFromJson,
  loadCache,
  invalidateCache,
  getAllProducts,
  getProductById,
  getProductByBarcode,
  validateEmissions,
  REQUIRED_EMISSION_KEYS,
  createProduct,
  updateProduct,
  softDeleteProduct,
};
