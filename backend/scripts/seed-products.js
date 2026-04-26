/**
 * Session 1: Seed products.json → Supabase products table.
 *
 * Idempotent — safe to re-run. Uses upsert on primary key.
 *
 * Prerequisites:
 *   SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in env.
 *   Use the service role key (bypasses RLS for seeding).
 *
 * Usage: node scripts/seed-products.js
 */

const { createClient } = require("@supabase/supabase-js");
const products = require("../src/data/products.json");

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CHUNK_SIZE = 50;

async function seed() {
  console.log(`Seeding ${products.length} products…`);

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Chunk ${i}–${i + CHUNK_SIZE} failed:`, error.message);
      process.exit(1);
    }
    process.stdout.write(`\r${Math.min(i + CHUNK_SIZE, products.length)}/${products.length}`);
  }

  console.log("\nDone.");
}

seed();
