#!/usr/bin/env node
/**
 * Frontend dependency audit gate.
 *
 * Replaces a bare `npm audit --audit-level=critical`. That had become a binary
 * choice between "fail forever on advisories that cannot affect this build" and
 * "turn the gate off". This keeps the gate on and narrows it to named,
 * justified, expiring exceptions: anything not on the list still fails, and so
 * does the list itself once it goes stale.
 *
 * Rationale for the current entries lives in /SECURITY.md — keep both in sync.
 */
const { execFileSync } = require("child_process");

const BLOCKING = new Set(["critical"]);

// Every entry must carry a reason, and the whole list a REVIEW_BY date. The
// date is only enforced while the list has entries: an empty list has nothing
// to go stale. Re-check entries when the date passes, when the deployment
// stops being a static export, or when Next is upgraded.
//
// Empty since the Next 16 upgrade (2026-11-28): the three `next` RCE
// exceptions accepted on 2026-10-30 no longer appear in `npm audit`.
const REVIEW_BY = null;

const ALLOWED = {};

function audit() {
  try {
    return JSON.parse(execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" }));
  } catch (err) {
    // npm audit exits non-zero when it finds anything; the report is still on stdout.
    if (err.stdout) return JSON.parse(err.stdout);
    throw err;
  }
}

function main() {
  const hasExceptions = Object.keys(ALLOWED).length > 0;
  if (hasExceptions && !REVIEW_BY) {
    console.error("audit-gate: ALLOWED has entries but no REVIEW_BY date. Set one.");
    process.exit(1);
  }
  if (hasExceptions && new Date() > new Date(REVIEW_BY)) {
    console.error(
      `audit-gate: exceptions expired on ${REVIEW_BY}. Re-verify them and update SECURITY.md.`
    );
    process.exit(1);
  }

  const found = new Map();
  for (const [pkg, v] of Object.entries(audit().vulnerabilities || {})) {
    for (const via of v.via || []) {
      if (typeof via !== "object" || !BLOCKING.has(via.severity)) continue;
      const id = (via.url || "").split("/").pop();
      if (!id) continue;
      if (!found.has(id)) found.set(id, { pkg, title: via.title });
    }
  }

  const unreviewed = [...found].filter(([id]) => !ALLOWED[id]);
  const covered = [...found].filter(([id]) => ALLOWED[id]);

  for (const [id, { pkg }] of covered) {
    console.log(`audit-gate: allowed ${id} (${pkg}) — ${ALLOWED[id]}`);
  }

  if (unreviewed.length) {
    console.error(
      `\naudit-gate: ${unreviewed.length} unreviewed ${[...BLOCKING].join("/")} advisory(ies):`
    );
    for (const [id, { pkg, title }] of unreviewed) {
      console.error(`  ${id}  [${pkg}]  ${title}`);
    }
    console.error(
      "\nTriage each in SECURITY.md, then add it to ALLOWED here, or upgrade the dependency."
    );
    process.exit(1);
  }

  const note = hasExceptions ? ` (exceptions reviewed by ${REVIEW_BY})` : " (no exceptions)";
  console.log(`audit-gate: pass — no unreviewed ${[...BLOCKING].join("/")} advisories${note}.`);
}

main();
