require("dotenv").config();
const logger = require("./utils/logger");
const app = require("./app");
const connectDB = require("./config/db");

const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET"];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.fatal({ missing }, "Missing required environment variables");
  process.exit(1);
}

if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const PORT = process.env.PORT || 5000;

connectDB().catch((err) => {
  logger.error({ err }, "Failed to connect to database");
});

module.exports = app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Server started");
  });
}
