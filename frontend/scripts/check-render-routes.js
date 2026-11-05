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
const yaml = require("js-yaml");

const BUILD = path.join(__dirname, "..", "build");
const RENDER_YAML = path.join(__dirname, "..", "..", "render.yaml");
const SITE_NAME = "consciobite-app";

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

function configuredRules() {
  const blueprint = yaml.load(fs.readFileSync(RENDER_YAML, "utf8"));
  const site = blueprint.services.find((s) => s.name === SITE_NAME);
  if (!site) throw new Error(`render.yaml: no service named ${SITE_NAME}`);
  return (site.routes || []).map((r) => r.source);
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
