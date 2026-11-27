#!/usr/bin/env node
/*
 * Loads the products page in a real browser and fails unless the product grid
 * renders, then checks one product page against its passport page. This is
 * the check `curl` cannot make: the HTML is static and always returns 200, while the products themselves arrive through client-side API
 * calls. A broken API URL, CORS rule or API outage leaves the HTML perfect and
 * the page useless.
 *
 * Env:
 *   SMOKE_BASE_URL    site to test (default https://consciobite-app.onrender.com)
 *   SMOKE_TIMEOUT_MS  how long to wait for the grid (default 150000 -- the API
 *                     sleeps on the free tier and can take a minute to wake)
 *   CHROMIUM_PATH     optional browser executable, for machines with one preinstalled
 *   SMOKE_PRODUCT_ID  product whose product and passport pages are checked (default 12)
 */
const { chromium } = require("playwright");

const BASE = (process.env.SMOKE_BASE_URL || "https://consciobite-app.onrender.com").replace(
  /\/$/,
  ""
);
const TIMEOUT = Number(process.env.SMOKE_TIMEOUT_MS || 150000);
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;

// The products grid proves the API is reachable. It says nothing about the
// pages people share, so also load one product page and its passport and check
// what they show: both render a score, the two scores agree, and the passport
// percentile is a real "Top N%" with N between 0 and 100.
const DETAIL_ID = process.env.SMOKE_PRODUCT_ID || "12";
const SCORE_SEL = '[data-testid="greengrade-score"]';

async function readScore(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  let score = null;
  try {
    await page.waitForSelector(SCORE_SEL, { timeout: 60000 });
    score = Number((await page.locator(SCORE_SEL).first().textContent()).trim());
    if (!Number.isFinite(score)) score = null;
  } catch {
    // fall through: score stays null and is reported
  }
  return { text: await page.evaluate(() => document.body.innerText), score };
}

async function checkDetailPages(page) {
  const problems = [];
  const product = await readScore(page, `${BASE}/product/${DETAIL_ID}/`);
  if (product.score === null) problems.push(`/product/${DETAIL_ID}/ shows no GreenGrade score`);

  const passport = await readScore(page, `${BASE}/passport/${DETAIL_ID}/`);
  if (passport.score === null) problems.push(`/passport/${DETAIL_ID}/ shows no GreenGrade score`);

  if (product.score !== null && passport.score !== null && product.score !== passport.score) {
    problems.push(
      `score mismatch: product page ${product.score}, passport page ${passport.score} (id ${DETAIL_ID})`
    );
  }

  const pct = passport.text.match(/Top\s+(-?\d+)%/);
  if (pct && (Number(pct[1]) < 0 || Number(pct[1]) > 100)) {
    problems.push(`passport percentile out of range: "${pct[0]}"`);
  }

  if (!problems.length) {
    console.log(`PASS: product and passport pages agree on ${product.score} / 10.`);
  } else {
    await page.screenshot({ path: "smoke-failure.png", fullPage: true });
  }
  return problems;
}

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
    const problems = await checkDetailPages(page);
    await browser.close();
    if (problems.length) {
      console.error("FAIL: product or passport page is wrong.");
      for (const p of problems) console.error(`  ${p}`);
      process.exit(1);
    }
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
