import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product Listing API",
      version: "1.0.0",
      description: "REST API for the product-listing backend.",
    },
    servers: [{ url: "http://localhost:5000", description: "Local server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Scan route files for @openapi JSDoc blocks. Both globs are included so the
  // spec builds whether running from src (ts-node-dev) or dist (compiled).
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
