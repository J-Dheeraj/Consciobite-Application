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
                confidence: {
                  type: "number",
                  description: "Algorithm confidence based on category sample size (0-1)",
                },
                dataConfidence: {
                  type: "number",
                  description: "Data provenance confidence score (0-1)",
                },
                dataTier: {
                  type: "integer",
                  enum: [1, 2, 3],
                  description:
                    "Data quality tier: 1=verified LCA, 2=aggregated database, 3=estimated",
                },
                dataTierLabel: {
                  type: "string",
                  enum: ["verified_lca", "aggregated_database", "estimated"],
                },
                sources: { type: "array", description: "Data sources used for emissions data" },
                sourceCount: {
                  type: "integer",
                  description: "Number of corroborating data sources",
                },
                referenceProduct: {
                  type: "string",
                  nullable: true,
                  description: "Matched reference product type from LCA research",
                },
                agreementWithReference: {
                  type: "number",
                  description: "Agreement score with reference data (0-1)",
                },
                lastVerified: {
                  type: "string",
                  description: "Date when emissions data was last verified",
                },
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
        MethodologyChangelogEntry: {
          type: "object",
          properties: {
            id: { type: "string" },
            version: { type: "string", example: "3.0" },
            category: {
              type: "string",
              enum: ["algorithm", "weights", "data-source", "other"],
            },
            summary: { type: "string" },
            commit_ref: { type: "string", nullable: true },
            changed_by: { type: "string" },
            change_date: { type: "string", format: "date-time" },
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
      "/methodology": {
        get: {
          tags: ["Methodology"],
          summary: "Get scoring methodology and data provenance documentation",
          description:
            "Returns comprehensive documentation about the GreenGrade scoring algorithm, data sources, confidence scoring formula, data tiers, and known limitations.",
          responses: {
            200: {
              description: "Methodology documentation",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      version: { type: "string" },
                      algorithm: { type: "object" },
                      dataSources: { type: "array" },
                      confidenceScoring: { type: "object" },
                      limitations: { type: "array", items: { type: "string" } },
                      references: { type: "array" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/methodology/changelog": {
        get: {
          tags: ["Methodology"],
          summary: "Get the GreenGrade methodology version changelog",
          description:
            "Returns the public version history of changes to the GreenGrade scoring algorithm itself (weights, formula, data sources) — distinct from per-product score drift.",
          responses: {
            200: {
              description: "Methodology changelog entries",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      entries: {
                        type: "array",
                        items: { $ref: "#/components/schemas/MethodologyChangelogEntry" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/admin/methodology-changelog": {
        get: {
          tags: ["Admin"],
          summary: "List all methodology changelog entries (admin)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Methodology changelog entries" },
            401: { description: "Not authenticated" },
            403: { description: "Not an admin" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Record a methodology/algorithm change (admin)",
          description:
            "Logs a new entry to the methodology changelog, e.g. when GreenGrade weights, formula, or data sources change.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["version", "category", "summary"],
                  properties: {
                    version: { type: "string", example: "3.1" },
                    category: {
                      type: "string",
                      enum: ["algorithm", "weights", "data-source", "other"],
                    },
                    summary: { type: "string" },
                    commitRef: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Changelog entry created" },
            400: { description: "Validation error" },
            401: { description: "Not authenticated" },
            403: { description: "Not an admin" },
          },
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
      "/v1/passport/{productId}": {
        get: {
          tags: ["Digital Product Passport"],
          summary: "Generate a Digital Product Passport for a single SKU",
          description:
            "Returns a structured JSON passport with GreenGrade score, percentile ranking, emission breakdown by supply chain stage, data confidence tier, and total carbon footprint. Designed for EU ESPR and SGX Scope 3 reporting.",
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "Digital Product Passport",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      product_id: { type: "string" },
                      product_name: { type: "string" },
                      brand: { type: "string" },
                      category: { type: "string" },
                      greengrade_score: { type: "number" },
                      score_percentile: { type: "integer" },
                      emission_breakdown: { type: "object" },
                      total_carbon_footprint_kg_co2e: { type: "number" },
                      data_confidence_tier: { type: "integer", enum: [1, 2, 3] },
                      data_confidence_label: { type: "string" },
                      passport_generated_at: { type: "string", format: "date-time" },
                      methodology_version: { type: "string" },
                    },
                  },
                },
              },
            },
            404: { description: "Product not found" },
          },
        },
      },
      "/v1/portfolio/score": {
        post: {
          tags: ["Digital Product Passport"],
          summary: "Score a portfolio of up to 100 SKUs",
          description:
            "Accepts an array of product IDs and returns individual passports, portfolio summary (average score, highest/lowest performers), and category benchmarks.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["product_ids"],
                  properties: {
                    product_ids: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 1,
                      maxItems: 100,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Scored portfolio with benchmarks" },
            400: { description: "Invalid input" },
            404: { description: "No valid products found" },
          },
        },
      },
      "/v1/audit/{productId}": {
        get: {
          tags: ["Digital Product Passport"],
          summary: "Get immutable score audit trail for a product",
          description:
            "Returns every recorded GreenGrade score change for the specified product, including old/new scores, delta, reason, and timestamp. Demonstrates algorithmic independence.",
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            200: { description: "Audit trail entries" },
            404: { description: "Product not found" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
