require("dotenv").config();
const logger = require("./utils/logger");
const app = require("./app");
const connectDB = require("./config/db");

const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET", "FRONTEND_URL"];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.fatal({ missing }, "Missing required environment variables");
  process.exit(1);
}

if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "UNHANDLED_REJECTION — shutting down");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "UNCAUGHT_EXCEPTION — shutting down");
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

connectDB().catch((err) => {
  logger.error({ err }, "Failed to connect to database — server will start without DB");
});

module.exports = app;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});

const shutdown = (signal) => {
  logger.info({ signal }, "Shutdown received — closing gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
