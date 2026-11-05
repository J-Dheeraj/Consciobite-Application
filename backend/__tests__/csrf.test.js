const { csrfProtection } = require("../src/middleware/auth");

// csrfProtection short-circuits when NODE_ENV === "test", which is what the
// rest of the suite runs under. Flip it per-call (the check is evaluated at
// call time) so the real branch is exercised.
function run({ method = "POST", headers = {}, cookies = {} } = {}) {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const req = { method, headers, cookies };
    let status = null;
    let body = null;
    let nexted = false;
    const res = {
      status(c) {
        status = c;
        return this;
      },
      json(b) {
        body = b;
        return this;
      },
    };
    csrfProtection(req, res, () => {
      nexted = true;
    });
    return { status, body, nexted };
  } finally {
    process.env.NODE_ENV = prev;
  }
}

const TOKEN = "a".repeat(64);

describe("csrfProtection", () => {
  test.each(["GET", "HEAD", "OPTIONS"])("%s is exempt", (method) => {
    expect(run({ method }).nexted).toBe(true);
  });

  test("rejects a mutation with no tokens", () => {
    const r = run();
    expect(r.status).toBe(403);
    expect(r.nexted).toBe(false);
  });

  test("rejects when only the header is present", () => {
    expect(run({ headers: { "x-csrf-token": TOKEN } }).status).toBe(403);
  });

  test("rejects when only the cookie is present", () => {
    expect(run({ cookies: { "csrf-token": TOKEN } }).status).toBe(403);
  });

  test("rejects a mismatched pair without throwing on unequal lengths", () => {
    const r = run({ headers: { "x-csrf-token": "short" }, cookies: { "csrf-token": TOKEN } });
    expect(r.status).toBe(403);
    expect(r.nexted).toBe(false);
  });

  test("rejects an equal-length but different token", () => {
    const r = run({
      headers: { "x-csrf-token": "b".repeat(64) },
      cookies: { "csrf-token": TOKEN },
    });
    expect(r.status).toBe(403);
  });

  test("accepts a matching double-submit pair", () => {
    const r = run({ headers: { "x-csrf-token": TOKEN }, cookies: { "csrf-token": TOKEN } });
    expect(r.nexted).toBe(true);
    expect(r.status).toBeNull();
  });
});

describe("CSRF is wired onto every mutating surface", () => {
  // Guards the T-7 regression: these two were reachable without a CSRF token.
  const app = require("../src/index");

  function layersFor(method, path) {
    const found = [];
    const walk = (stack, prefix = "") => {
      for (const layer of stack) {
        if (layer.route) {
          const p = prefix + layer.route.path;
          if (layer.route.methods[method]) {
            found.push({ path: p, names: layer.route.stack.map((s) => s.name) });
          }
        } else if (layer.handle && layer.handle.stack) {
          const src = layer.regexp && layer.regexp.source;
          const seg = src ? src.replace("^\\/", "/").replace("\\/?(?=\\/|$)", "") : "";
          walk(layer.handle.stack, prefix + (seg.startsWith("/") ? seg : ""));
        }
      }
    };
    walk(app._router.stack);
    return found.filter((f) => f.path.includes(path));
  }

  test("DELETE /auth/account runs csrfProtection", () => {
    const hits = layersFor("delete", "/account");
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.names).toContain("csrfProtection");
  });

  test("PATCH /auth/me still runs csrfProtection", () => {
    const hits = layersFor("patch", "/me");
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.names).toContain("csrfProtection");
  });
});
