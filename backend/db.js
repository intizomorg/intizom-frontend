const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/intizom");
    console.log("MongoDB ulandi");
  } catch (err) {
    console.error("MongoDB ulanish xatosi:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
