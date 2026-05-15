const logger = require("../utils/logger");
const mongoose = require("mongoose");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 4500,
    });

    logger.info({ host: conn.connection.host }, "MongoDB connected");
    return true;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      logger.warn({ retry: retryCount + 1, maxRetries: MAX_RETRIES, delay }, "MongoDB connection failed, retrying");
      await sleep(delay);
      return connectDB(retryCount + 1);
    }

    logger.fatal({ err: error }, "MongoDB connection failed after all retries");
    process.exit(1);
  }
};

module.exports = connectDB;
