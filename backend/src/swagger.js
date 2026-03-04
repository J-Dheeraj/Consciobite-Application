const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Consciobite API",
      version: "2.0.0",
      description:
        "GreenGrade sustainability scoring API for food products. Browse 550+ products, compare environmental impact, track your carbon footprint, and discover sustainable recipes.",
      contact: { name: "Consciobite Team" },
    },
    servers: [{ url: "/api", description: "API Base" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            brand: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            barcode: { type: "string" },
            greenGrade: {
              type: "object",
              properties: {
                score: { type: "number" },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                totalEmissions: { type: "number" },
                breakdown: { type: "array" },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string" },
            product_id: { type: "string" },
            user_id: { type: "string" },
            user_name: { type: "string" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CarbonLog: {
          type: "object",
          properties: {
            id: { type: "string" },
            user_id: { type: "string" },
            product_id: { type: "string" },
            product_name: { type: "string" },
            quantity: { type: "number" },
            emissions: { type: "number" },
            logged_at: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/products": {
        get: {
          tags: ["Products"],
          summary: "List products with GreenGrade scores",
          parameters: [
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            {
              name: "sort",
              in: "query",
              schema: {
                type: "string",
                enum: ["grade_asc", "grade_desc", "emissions_asc", "emissions_desc"],
              },
            },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          ],
          responses: {
            200: { description: "Product list with pagination" },
          },
        },
      },
      "/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Get product details by ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Product details" },
            404: { description: "Product not found" },
          },
        },
      },
      "/products/scan/{barcode}": {
        get: {
          tags: ["Products"],
          summary: "Look up product by barcode",
          parameters: [{ name: "barcode", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Product found" },
            404: { description: "Product not found - falls back to Open Food Facts" },
          },
        },
      },
      "/products/compare": {
        get: {
          tags: ["Products"],
          summary: "Compare multiple products",
          parameters: [
            {
              name: "ids",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Comma-separated product IDs (2-5)",
            },
          ],
          responses: { 200: { description: "Compared products" } },
        },
      },
      "/products/stats": {
        get: {
          tags: ["Products"],
          summary: "Get category statistics",
          responses: { 200: { description: "Aggregated statistics" } },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "name", "password"],
                  properties: {
                    email: { type: "string" },
                    name: { type: "string" },
                    password: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Account created" },
            409: { description: "Email already registered" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login to existing account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: { email: { type: "string" }, password: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "User profile" },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/reviews/{productId}": {
        get: {
          tags: ["Reviews"],
          summary: "Get reviews for a product",
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Reviews list with stats" } },
        },
        post: {
          tags: ["Reviews"],
          summary: "Add a review",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["rating"],
                  properties: {
                    rating: { type: "integer", minimum: 1, maximum: 5 },
                    comment: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Review created" } },
        },
      },
      "/carbon/summary": {
        get: {
          tags: ["Carbon Tracker"],
          summary: "Get carbon footprint summary",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Carbon summary with trends" } },
        },
      },
      "/carbon/log": {
        post: {
          tags: ["Carbon Tracker"],
          summary: "Log a product purchase",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId", "productName", "emissions"],
                  properties: {
                    productId: { type: "string" },
                    productName: { type: "string" },
                    quantity: { type: "number", default: 1 },
                    emissions: { type: "number" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Log created" } },
        },
      },
      "/recipes": {
        get: {
          tags: ["Recipes"],
          summary: "Get sustainable recipe suggestions",
          parameters: [{ name: "tag", in: "query", schema: { type: "string" } }],
          responses: { 200: { description: "Recipe list with green ingredients" } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
