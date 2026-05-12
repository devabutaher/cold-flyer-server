require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const PORT = process.env.PORT || 5000;

// Connect to DB immediately
connectDB();

// This is required for Vercel to pick up the app
module.exports = app;

// Only start listening if we are NOT on Vercel (local dev)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
