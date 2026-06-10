const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/error.middleware");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const serviceRoutes = require("./routes/service.routes");
const reviewRoutes = require("./routes/review.routes");
const paymentRoutes = require("./routes/payment.routes");
const sslcommerzRoutes = require("./routes/sslcommerz.routes");
const { handleReturn } = require("./controllers/sslcommerz.controller");
const adminRoutes = require("./routes/admin.routes");
const couponRoutes = require("./routes/coupon.routes");
const jobApplicationRoutes = require("./routes/jobApplication.routes");
const blogRoutes = require("./routes/blog.routes");
const recentWorkRoutes = require("./routes/recentWork.routes");
const expenseRoutes = require("./routes/expense.routes");
const customerRoutes = require("./routes/customer.routes");
const activityRoutes = require("./routes/activity.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const locationRoutes = require("./routes/location.routes");
const messageRoutes = require("./routes/message.routes");

const app = express();

// ── Request ID ─────────────────────────────────────────
app.use((req, res, next) => {
  req.id = crypto.randomBytes(8).toString("hex");
  res.setHeader("X-Request-ID", req.id);
  next();
});

// ── Request logging ────────────────────────────────────
const isDev = process.env.NODE_ENV !== "production";
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const method = isDev ? colors.cyan(req.method) : req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    let coloredStatus;
    if (isDev) {
      coloredStatus = status >= 500 ? colors.red(status) : status >= 400 ? colors.yellow(status) : colors.green(status);
    } else {
      coloredStatus = status;
    }
    const time = isDev ? colors.dim(`${Date.now() - start}ms`) : `${Date.now() - start}ms`;
    console.log(`${method} ${url} ${coloredStatus} ${time}`);
  });
  next();
});

// ── Security headers ───────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://accounts.google.com",
          "https://www.googletagmanager.com",
          "https://sandbox.sslcommerz.com",
          "https://sslcommerz.com",
          "https://secure.sslcommerz.com",
        ],
        frameSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://accounts.google.com",
          "https://sandbox.sslcommerz.com",
          "https://sslcommerz.com",
          "https://secure.sslcommerz.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
        ],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.unsplash.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);

// ── Compression ────────────────────────────────────────
app.use(compression());

// ── CORS ───────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

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
  const dbState = mongoose.connection.readyState;
  res.json({
    success: true,
    message: "ColdFlyer API is running",
    timestamp: new Date().toISOString(),
    requestId: req.id,
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
    database: {
      connected: dbState === 1,
      state: ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown",
    },
  });
});

// ── Public stats (no auth) ─────────────────────────────
const statsRoutes = require("./routes/stats.routes");
app.use("/api/public/stats", statsRoutes);

// ── Auth routes ────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── SSLCOMMERZ return (no CSRF — SSLCOMMERZ POSTs directly) ──
const sslReturnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.post("/api/payments/sslcommerz/return", sslReturnLimiter, handleReturn);

// ── API routes ─────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payments/sslcommerz", sslcommerzRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/job-applications", jobApplicationRoutes);

// ── Blog routes ────────────────────────────────────────
app.use("/api/blogs", blogRoutes);

// ── Recent Works routes ────────────────────────────────
app.use("/api/recent-works", recentWorkRoutes);

// ── New Feature routes ─────────────────────────────────
app.use("/api/expenses", expenseRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/messages", messageRoutes);

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
