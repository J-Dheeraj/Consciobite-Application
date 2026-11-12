#!/usr/bin/env node
/*
 * Loads the products page in a real browser and fails unless the product grid
 * renders. This is the check `curl` cannot make: the HTML is static and always
 * returns 200, while the products themselves arrive through client-side API
 * calls. A broken API URL, CORS rule or API outage leaves the HTML perfect and
 * the page useless.
 *
 * Env:
 *   SMOKE_BASE_URL    site to test (default https://consciobite-app.onrender.com)
 *   SMOKE_TIMEOUT_MS  how long to wait for the grid (default 150000 -- the API
 *                     sleeps on the free tier and can take a minute to wake)
 *   CHROMIUM_PATH     optional browser executable, for machines with one preinstalled
 */
const { chromium } = require("playwright");

const BASE = (process.env.SMOKE_BASE_URL || "https://consciobite-app.onrender.com").replace(
  /\/$/,
  ""
);
const TIMEOUT = Number(process.env.SMOKE_TIMEOUT_MS || 150000);
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    proxy: proxy ? { server: proxy } : undefined,
  });
  const context = await browser.newContext({ ignoreHTTPSErrors: Boolean(proxy) });
  const page = await context.newPage();

  const failed = new Set();
  page.on("requestfailed", (r) =>
    failed.add(`${r.method()} ${r.url()} -- ${r.failure()?.errorText}`)
  );

  const url = `${BASE}/products/`;
  console.log(`Loading ${url} (waiting up to ${TIMEOUT / 1000}s for products)`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  let cards = 0;
  try {
    await page.waitForSelector('[data-testid="product-card"]', { timeout: TIMEOUT });
    cards = await page.locator('[data-testid="product-card"]').count();
  } catch {
    // fall through to the failure report
  }

  if (cards > 0) {
    console.log(`PASS: ${cards} product cards rendered.`);
    await browser.close();
    return;
  }

  const text = await page.evaluate(() => document.body.innerText);
  const shown = text.match(
    /Failed to fetch|Can't reach the server[^\n]*|Waking up the server[^\n]*/g
  );
  await page.screenshot({ path: "smoke-failure.png", fullPage: true });
  console.error("FAIL: no product cards rendered.");
  console.error(`  message on page: ${shown ? [...new Set(shown)].join(" | ") : "(none)"}`);
  console.error(`  failed requests: ${failed.size || "none"}`);
  for (const f of [...failed].slice(0, 10)) console.error(`    ${f}`);
  console.error("  screenshot: smoke-failure.png");
  await browser.close();
  process.exit(1);
})().catch((err) => {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
});
