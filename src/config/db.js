const mongoose = require("mongoose");

mongoose.set("bufferTimeoutMS", 30000);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing DB connection");
    return;
  }
  
  console.log("Attempting DB connection...");
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 25000,
      socketTimeoutMS: 25000,
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.log("App will continue without database");
  }
  
  return true;
};

module.exports = connectDB;
