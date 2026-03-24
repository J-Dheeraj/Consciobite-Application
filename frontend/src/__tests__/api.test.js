import { fetchProducts, fetchProduct, loginUser, registerUser } from "../services/api";

// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("safeFetch / API service", () => {
  test("fetchProducts builds URL with search params", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ products: [], pagination: {} }),
    });

    await fetchProducts({ search: "apple", limit: 5 });

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("search=apple");
    expect(calledUrl).toContain("limit=5");
  });

  test("fetchProducts sends request with correct headers", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ products: [], pagination: {} }),
    });

    await fetchProducts();

    const options = global.fetch.mock.calls[0][1];
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  test("fetchProducts includes auth token when present", async () => {
    localStorage.setItem("consciobite_token", "test-jwt-token");
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ products: [], pagination: {} }),
    });

    await fetchProducts();

    const options = global.fetch.mock.calls[0][1];
    expect(options.headers.Authorization).toBe("Bearer test-jwt-token");
  });

  test("fetchProduct encodes product ID", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "abc123" }),
    });

    await fetchProduct("abc123");

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("/products/abc123");
  });

  test("throws error with server message on failure", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad request" }),
    });

    await expect(fetchProducts()).rejects.toThrow("Bad request");
  });

  test("throws generic error when server returns no error message", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(fetchProducts()).rejects.toThrow("Request failed (500)");
  });

  test("loginUser sends POST with credentials", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: { id: "1" }, token: "tok" }),
    });

    const result = await loginUser("test@example.com", "Password1");

    const options = global.fetch.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      email: "test@example.com",
      password: "Password1",
    });
    expect(result.token).toBe("tok");
  });

  test("registerUser sends POST with user data", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: { id: "1" }, token: "tok" }),
    });

    await registerUser("Test", "test@example.com", "Password1");

    const options = global.fetch.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      name: "Test",
      email: "test@example.com",
      password: "Password1",
    });
  });
});
