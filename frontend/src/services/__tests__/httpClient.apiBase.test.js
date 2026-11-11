/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://consciobite-app.onrender.com/products/"}
 */
// The page is served from the deployed frontend host (set above), because the
// fallback infers the API host from window.location.
//
// API_BASE is computed once at module load, so each case loads a fresh copy.
function loadApiBase(env) {
  const prev = process.env.NEXT_PUBLIC_API_URL;
  if (env === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = env;
  let base;
  jest.isolateModules(() => {
    base = require("../httpClient").API_BASE;
  });
  if (prev === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = prev;
  return base;
}

describe("API base URL", () => {
  test("a full URL is used as configured", () => {
    expect(loadApiBase("https://consciobite-api.onrender.com")).toBe(
      "https://consciobite-api.onrender.com/api"
    );
  });

  test("a public hostname without a scheme gets https", () => {
    expect(loadApiBase("consciobite-api.onrender.com")).toBe(
      "https://consciobite-api.onrender.com/api"
    );
  });

  test("localhost is honoured for local development", () => {
    expect(loadApiBase("http://localhost:4000")).toBe("http://localhost:4000/api");
  });

  // Render's fromService `host` property yields the service's INTERNAL name.
  // Baking that in produced https://consciobite-api/api, which no browser can
  // resolve, so every API call failed with "Failed to fetch".
  test("a bare internal hostname is not treated as a usable URL", () => {
    const base = loadApiBase("consciobite-api");
    expect(base).not.toBe("https://consciobite-api/api");
    expect(base).toBe("https://consciobite-api.onrender.com/api");
  });

  test("with nothing configured, the host is inferred on Render", () => {
    expect(loadApiBase(undefined)).toBe("https://consciobite-api.onrender.com/api");
  });
});
