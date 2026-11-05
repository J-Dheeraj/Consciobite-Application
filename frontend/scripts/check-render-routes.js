#!/usr/bin/env node
/*
 * Fails if the static export and render.yaml have drifted apart.
 *
 * render.yaml lists one rewrite per prerendered route instead of a "/*"
 * catch-all, because Render returns a real 404 only when NO rule matches a
 * path (resource exists -> serve it; else first matching rule; else 404). A
 * catch-all therefore turns every unknown URL into an empty 200.
 *
 * The cost of explicit rules is that a new page needs a new rule. This script
 * is that reminder: run it after `npm run build`.
 */
const fs = require("fs");
const path = require("path");

const BUILD = path.join(__dirname, "..", "build");
const RENDER_YAML = path.join(__dirname, "..", "..", "render.yaml");

// Routes Render resolves without a rule, so they need none:
// "/" is the domain root (rules are not allowed on it) and /404 is the error
// page itself. /_next holds hashed assets, always requested by exact path.
const EXEMPT = (route) => route === "/" || route === "/404" || route.startsWith("/_next");

function builtRoutes(dir, base = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const route = `${base}/${entry.name}`;
    const full = path.join(dir, entry.name);
    if (fs.existsSync(path.join(full, "index.html"))) out.push(route);
    out.push(...builtRoutes(full, route));
  }
  return out;
}

// render.yaml is hand-maintained and flat here; parse the consciobite-app
// routes block without adding a YAML dependency to the frontend.
function configuredRules() {
  const lines = fs.readFileSync(RENDER_YAML, "utf8").split("\n");
  const start = lines.findIndex((l) => /^\s*routes:\s*$/.test(l));
  if (start === -1) throw new Error("render.yaml: no routes: block found");
  const rules = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s{0,3}\S/.test(line) && line.trim()) break; // dedented out of the block
    const source = line.match(/^\s*(?:- type: \w+\s*)?source:\s*(\S+)/);
    if (source) rules.push(source[1]);
  }
  return rules;
}

const matches = (source, route) =>
  source.includes("*") ? route.startsWith(source.slice(0, source.indexOf("*"))) : source === route;

const routes = builtRoutes(BUILD).filter((r) => !EXEMPT(r));
const rules = configuredRules();

if (!routes.length) {
  console.error("No prerendered routes found in build/. Run `npm run build` first.");
  process.exit(1);
}
if (rules.some((s) => s === "/*")) {
  console.error('render.yaml has a "/*" catch-all: every unknown URL becomes an empty 200.');
  process.exit(1);
}

const uncovered = routes.filter((r) => !rules.some((s) => matches(s, r)));
const dead = rules.filter((s) => !routes.some((r) => matches(s, r)));

for (const r of uncovered) console.error(`No render.yaml rewrite for built route ${r}`);
for (const s of dead) console.error(`render.yaml rule ${s} matches no built route`);

if (uncovered.length || dead.length) {
  console.error(`\n${uncovered.length} uncovered route(s), ${dead.length} dead rule(s).`);
  process.exit(1);
}

console.log(`render.yaml covers all ${routes.length} prerendered routes (${rules.length} rules).`);
