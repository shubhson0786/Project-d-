const mongoose = require("mongoose");
const { connectDatabase } = require("./_database");

const holdingSchema = new mongoose.Schema({}, { strict: false, collection: "holdings" });
const Holding = mongoose.models.Holding || mongoose.model("Holding", holdingSchema);

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDatabase();
    return res.json(await Holding.find().lean());
  } catch (error) {
    console.error("Holdings API error", error);
    return res.status(500).json({ error: "Failed to load holdings." });
  }
};
