import pino from "pino";

const isProduction = process.env["NODE_ENV"] === "production";

/**
 * Application-wide structured logger. In development it pretty-prints; in
 * production it emits newline-delimited JSON for log aggregation.
 */
export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? (isProduction ? "info" : "debug"),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }),
});
