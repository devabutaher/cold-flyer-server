const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/error.middleware");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const cartRoutes = require("./routes/cart.routes");
const serviceRoutes = require("./routes/service.routes");
const reviewRoutes = require("./routes/review.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(helmet());

// CRITICAL: Webhook must be FIRST - before ANY body parsing
// Use express.raw() - Stripe webhook needs EXACT raw body
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes.webhookHandler
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 500,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
app.use("/api", limiter);

const admin = require("./config/firebase");

const mongoose = require("mongoose");

app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    message: "ColdFlyer API is running",
    timestamp: new Date().toISOString(),
    firebaseConfigured: admin.apps.length > 0,
    databaseConnected: isDbConnected,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", require("./routes/upload.routes"));

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Route not found", code: "NOT_FOUND" });
});

app.use(errorHandler);

module.exports = app;
