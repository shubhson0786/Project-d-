const mongoose = require("mongoose");

let connectionPromise;

function connectDatabase() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not configured");
  if (!connectionPromise) connectionPromise = mongoose.connect(process.env.MONGO_URL);
  return connectionPromise;
}

module.exports = { connectDatabase };
