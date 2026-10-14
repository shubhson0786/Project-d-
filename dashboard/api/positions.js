const mongoose = require("mongoose");
const { connectDatabase } = require("./_database");

const positionSchema = new mongoose.Schema({}, { strict: false, collection: "positions" });
const Position = mongoose.models.Position || mongoose.model("Position", positionSchema);

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDatabase();
    return res.json(await Position.find().lean());
  } catch (error) {
    console.error("Positions API error", error);
    return res.status(500).json({ error: "Failed to load positions." });
  }
};
