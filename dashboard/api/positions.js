const { requireUser } = require("../lib/auth");
const { connectDatabase } = require("../lib/database");
const { portfolio } = require("../lib/portfolio");
module.exports = async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try { await connectDatabase(); return res.json(await portfolio(user.sub)); }
  catch (error) { console.error(error.message); return res.status(500).json({ error: "Could not load portfolio." }); }
};
