require("dotenv").config();
console.log("Starting server...");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

const app = require("./app");
console.log("App loaded");

const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

(async () => {
  console.log("Connecting to DB...");
  await connectDB();
  console.log("DB connection done");
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    server.close(() => process.exit(0));
  });
})();
