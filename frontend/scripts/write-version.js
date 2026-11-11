#!/usr/bin/env node
/*
 * Publishes the commit this build came from as build/version.json.
 *
 * The post-deploy smoke test (.github/workflows/smoke.yml) polls this file so
 * it tests the deploy of the commit that was just pushed, not whatever was
 * live a minute earlier. Render sets RENDER_GIT_COMMIT during the build.
 */
const fs = require("fs");
const path = require("path");

const commit = process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "unknown";
fs.writeFileSync(
  path.join(__dirname, "..", "build", "version.json"),
  JSON.stringify({ commit }) + "\n"
);
