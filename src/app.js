const crypto = require('crypto');
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require("express-rate-limit");
const pinoHttp = require('pino-http');
const logger = require("./utils/logger");
const errorHandler = require("./middleware/error.middleware");
const { csrfProtection } = require("./middleware/csrf.middleware");
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

// ── Request ID ─────────────────────────────────────────
app.use((req, res, next) => {
  req.id = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ── Request logging ────────────────────────────────────
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
}));

// ── Security headers ───────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://accounts.google.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://accounts.google.com"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.unsplash.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Compression ────────────────────────────────────────
app.use(compression());

// CRITICAL: Webhook must be BEFORE any body parsing
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes.webhookHandler
);

// ── CORS ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// ── Body parsing ───────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── NoSQL injection protection ─────────────────────────
app.use(mongoSanitize());

// ── Global rate limiter ────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 500,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api", globalLimiter);

// ── Health check (no auth) ─────────────────────────────
const mongoose = require("mongoose");

app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    message: "ColdFlyer API is running",
    timestamp: new Date().toISOString(),
    requestId: req.id,
    databaseConnected: isDbConnected,
  });
});

// ── Auth routes (no CSRF needed) ───────────────────────
app.use("/api/auth", authRoutes);

// ── CSRF protection for state-changing routes ──────────
app.use("/api", csrfProtection);

// ── API routes ─────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", require("./routes/upload.routes"));

// ── 404 handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    code: "NOT_FOUND",
    requestId: req.id,
  });
});

// ── Global error handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;
