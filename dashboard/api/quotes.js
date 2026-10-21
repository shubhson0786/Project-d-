const { requireUser } = require("../lib/auth");
const { quotes } = require("../lib/market");
module.exports = (req, res) => {
  if (!requireUser(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.json({ source: "SIMULATED", quotes: quotes() });
};
