// The OpenAPI spec is fully defined inline below (no JSDoc-comment scanning),
// so swagger-jsdoc is not needed — its glob dependency chain carried
// unpatchable audit findings, and with `apis: []` it was a pass-through.
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
        EvidenceSource: {
          type: "object",
          properties: {
            key: { type: "string", description: "Unique identifier for this source" },
            title: { type: "string" },
            authors: { type: "string", nullable: true },
            year: { type: "integer" },
            doi: { type: "string", nullable: true },
            url: { type: "string", nullable: true },
            source_type: {
              type: "string",
              enum: [
                "peer_reviewed_lca",
                "curated_aggregation",
                "crowdsourced_database",
                "derived_estimate",
              ],
            },
            methodology: { type: "string", nullable: true },
            granularity: { type: "string", enum: ["product_type", "brand_product", "category"] },
            reliability: { type: "string", enum: ["high", "medium", "low"] },
            ingested_by: { type: "string", nullable: true },
            ingested_at: { type: "string", format: "date-time" },
            notes: { type: "string", nullable: true },
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
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Log out: revoke the presented token and clear the cookie",
          description:
            "The presented token's jti is written to the revocation registry, so stolen copies cannot be replayed. Idempotent — succeeds without a token.",
          responses: { 200: { description: "Logged out" } },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rotate the session: issue a fresh token and cookie",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "New token with expiresAt (ms epoch)" },
            401: { description: "Invalid, expired, or revoked token" },
          },
        },
      },
      "/auth/export": {
        get: {
          tags: ["Auth"],
          summary: "Export all stored data for the authenticated user",
          description: "Data portability: returns profile, reviews, and carbon logs as JSON.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Full user data export" },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/auth/account": {
        delete: {
          tags: ["Auth"],
          summary: "Permanently delete the account and all associated data",
          description:
            "Requires the current password as confirmation. Deletes profile, reviews, carbon history, and token records in one transaction.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["password"],
                  properties: { password: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Account deleted" },
            401: { description: "Incorrect password or not authenticated" },
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
            "Returns a structured JSON passport with GreenGrade score, percentile ranking, emission breakdown by supply chain stage, data confidence tier, and total carbon footprint. Structured to support EU ESPR and SGX Scope 3 reporting workflows.",
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
      "/v1/ml/similar/{productId}": {
        get: {
          tags: ["ML Insights"],
          summary: "Find greener alternatives by cosine similarity",
          description:
            "Returns the top-k most similar products by cosine similarity over the scaled 7-dimension emissions vector. Defaults to greener (lower total emissions) alternatives only. Advisory — backed by the offline-trained ML artifacts, separate from the GreenGrade engine.",
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
            { name: "k", in: "query", schema: { type: "integer", default: 5, maximum: 20 } },
            { name: "greenerOnly", in: "query", schema: { type: "boolean", default: true } },
          ],
          responses: {
            200: { description: "Similar products with similarity scores" },
            404: { description: "Product not found in similarity index" },
            503: { description: "ML artifacts not loaded" },
          },
        },
      },
      "/v1/ml/classify": {
        post: {
          tags: ["ML Insights"],
          summary: "Predict product category from an emissions profile",
          description:
            "Decision-tree prediction of the product category from the 7 emission stages. Advisory only — intended for mis-tag detection and category pre-fill, never an automatic category assignment.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    landUseChange: { type: "number" },
                    animalFeed: { type: "number" },
                    farm: { type: "number" },
                    processing: { type: "number" },
                    transport: { type: "number" },
                    packaging: { type: "number" },
                    retail: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Predicted category (advisory)" },
            400: { description: "Invalid emissions payload" },
            503: { description: "ML artifacts not loaded" },
          },
        },
      },
      "/v1/ml/estimate-emissions": {
        post: {
          tags: ["ML Insights"],
          summary: "Estimate total emissions from partial logistics data",
          description:
            "Regression-tree estimate of total emissions from only the transport, packaging, and retail stages. Advisory upgrade path for Tier 3 (estimated) products.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    transport: { type: "number" },
                    packaging: { type: "number" },
                    retail: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Estimated total emissions in kg CO2e (advisory)" },
            400: { description: "Invalid input" },
            503: { description: "ML artifacts not loaded" },
          },
        },
      },
      "/v1/ml/clusters": {
        get: {
          tags: ["ML Insights"],
          summary: "K-Means cluster summary",
          responses: {
            200: { description: "Cluster count and products per cluster" },
            503: { description: "ML artifacts not loaded" },
          },
        },
      },
      "/v1/ml/clusters/{productId}": {
        get: {
          tags: ["ML Insights"],
          summary: "Cluster membership for one product",
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Cluster label" },
            404: { description: "Product not found" },
            503: { description: "ML artifacts not loaded" },
          },
        },
      },
      "/v1/audit/{productId}": {
        get: {
          tags: ["Digital Product Passport"],
          summary: "Get the score audit trail for a product",
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
      "/favorites": {
        get: {
          tags: ["Favorites"],
          summary: "List saved favorite product IDs",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Array of favorited product IDs" },
            401: { description: "Not authenticated" },
          },
        },
        post: {
          tags: ["Favorites"],
          summary: "Add a product to favorites",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId"],
                  properties: { productId: { type: "string", maxLength: 50 } },
                },
              },
            },
          },
          responses: {
            201: { description: "Favorite added" },
            400: { description: "Missing productId" },
            401: { description: "Not authenticated" },
            409: { description: "Already in favorites" },
          },
        },
      },
      "/favorites/all": {
        delete: {
          tags: ["Favorites"],
          summary: "Clear all favorites",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Number of favorites deleted" },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/favorites/{productId}": {
        delete: {
          tags: ["Favorites"],
          summary: "Remove a specific favorite",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Favorite removed" },
            401: { description: "Not authenticated" },
            404: { description: "Favorite not found" },
          },
        },
      },
      "/v1/evidence/sources": {
        get: {
          tags: ["Evidence & Provenance"],
          summary: "List all evidence sources",
          description:
            "Returns the registry of literature sources, databases, and estimation methods that back GreenGrade emission factors.",
          parameters: [
            {
              name: "reliability",
              in: "query",
              schema: { type: "string", enum: ["high", "medium", "low"] },
              description: "Filter by reliability tier",
            },
          ],
          responses: {
            200: {
              description: "Array of evidence sources",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/EvidenceSource" } },
                },
              },
            },
            400: { description: "Invalid reliability value" },
          },
        },
        post: {
          tags: ["Evidence & Provenance"],
          summary: "Ingest a new evidence source (admin only)",
          description: "Add a new literature source or database to the evidence registry.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["key", "title", "year", "source_type", "reliability"],
                  properties: {
                    key: { type: "string", description: "Unique slug, e.g. clark-2022" },
                    title: { type: "string" },
                    authors: { type: "string" },
                    year: { type: "integer" },
                    doi: { type: "string" },
                    url: { type: "string" },
                    source_type: { type: "string" },
                    methodology: { type: "string" },
                    granularity: {
                      type: "string",
                      enum: ["product_type", "brand_product", "category"],
                    },
                    reliability: { type: "string", enum: ["high", "medium", "low"] },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Created evidence source" },
            400: { description: "Validation error" },
            401: { description: "Authentication required" },
            403: { description: "Admin access required" },
            409: { description: "Source key already exists" },
          },
        },
      },
      "/v1/evidence/sources/{key}": {
        get: {
          tags: ["Evidence & Provenance"],
          summary: "Get a single evidence source",
          parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Evidence source with explicit link count",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/EvidenceSource" },
                      { type: "object", properties: { explicitLinkCount: { type: "integer" } } },
                    ],
                  },
                },
              },
            },
            400: { description: "Invalid key format" },
            404: { description: "Source not found" },
          },
        },
      },
      "/v1/evidence/product/{id}": {
        get: {
          tags: ["Evidence & Provenance"],
          summary: "Get provenance for a product",
          description:
            "Returns the computed data provenance (tier, sources, confidence) and any explicit product-to-source links recorded by admins.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Product provenance with computed confidence and explicit links" },
            400: { description: "Invalid product ID" },
            404: { description: "Product not found" },
          },
        },
      },
      "/v1/evidence/product-link": {
        post: {
          tags: ["Evidence & Provenance"],
          summary: "Link a product to an evidence source (admin only)",
          description:
            "Records an explicit provenance link between a product and a literature source, optionally scoped to a single emission category.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["product_id", "source_key"],
                  properties: {
                    product_id: { type: "string" },
                    source_key: { type: "string" },
                    emission_category: {
                      type: "string",
                      description: "Scope to one of the 7 GreenGrade dimensions, or omit for all",
                      enum: [
                        "Land Use Change",
                        "Animal Feed",
                        "Farm",
                        "Processing",
                        "Transport",
                        "Packaging",
                        "Retail",
                      ],
                    },
                    confidence_override: { type: "string", enum: ["high", "medium", "low"] },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Link created" },
            400: { description: "Validation error" },
            401: { description: "Authentication required" },
            403: { description: "Admin access required" },
            404: { description: "Product or source not found" },
            409: { description: "Link already exists" },
          },
        },
      },
      "/v1/export/catalog": {
        get: {
          summary: "Export full product catalog with GreenGrade scores",
          description:
            "Returns the complete Consciobite product catalog enriched with GreenGrade sustainability scores. " +
            "Supports JSON (default) and CSV formats for B2B Scope 3 reporting and digital product passport integrations. " +
            "The X-Catalog-Sha256 response header contains a SHA-256 hash of products.json that clients can use to detect catalog changes without re-downloading.",
          tags: ["Catalog Export"],
          parameters: [
            {
              name: "format",
              in: "query",
              description: "Response format — json (default) or csv",
              schema: { type: "string", enum: ["json", "csv"], default: "json" },
            },
            {
              name: "category",
              in: "query",
              description: "Filter by product category (exact match, case-insensitive)",
              schema: { type: "string", example: "Dairy" },
            },
            {
              name: "tier",
              in: "query",
              description: "Filter by GreenGrade tier: green (≥7), amber (4–6.9), red (<4)",
              schema: { type: "string", enum: ["green", "amber", "red"] },
            },
          ],
          responses: {
            200: {
              description: "Catalog export (JSON or CSV depending on ?format)",
              headers: {
                "X-Catalog-Sha256": {
                  description: "SHA-256 hash of products.json at build time",
                  schema: { type: "string" },
                },
                "X-Methodology-Version": {
                  description: "GreenGrade methodology version used for scoring",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      metadata: {
                        type: "object",
                        properties: {
                          generated_at: { type: "string", format: "date-time" },
                          methodology_version: { type: "string" },
                          catalog_hash: {
                            type: "string",
                            description: "SHA-256 of products.json",
                          },
                          product_count: { type: "integer" },
                          filters: {
                            type: "object",
                            properties: {
                              category: { type: "string", nullable: true },
                              tier: { type: "string", nullable: true },
                            },
                          },
                        },
                      },
                      products: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            brand: { type: "string" },
                            category: { type: "string" },
                            greengrade_score: {
                              type: "number",
                              description: "0–10 sustainability score (10 = most sustainable)",
                            },
                            score_tier: {
                              type: "string",
                              enum: ["green", "amber", "red"],
                            },
                            score_percentile: { type: "number", nullable: true },
                            total_carbon_footprint_kg_co2e: { type: "number" },
                            emission_breakdown: {
                              type: "object",
                              properties: {
                                land_use_change: { type: "number" },
                                animal_feed: { type: "number" },
                                farm_operations: { type: "number" },
                                processing: { type: "number" },
                                transport: { type: "number" },
                                packaging: { type: "number" },
                                retail: { type: "number" },
                              },
                            },
                            data_confidence_tier: {
                              type: "integer",
                              nullable: true,
                              enum: [1, 2, 3],
                            },
                            data_confidence_label: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
                "text/csv": {
                  schema: {
                    type: "string",
                    description:
                      "RFC 4180 CSV with header row. Columns: ID, Name, Brand, Category, GreenGrade Score, Score Tier, Score Percentile, Total CO2e (kg), and the 7 emission dimension columns.",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = options.definition;

module.exports = { swaggerSpec };
