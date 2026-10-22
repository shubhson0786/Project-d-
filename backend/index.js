require("dotenv").config();
// The dashboard's local API credentials live in its own ignored .env file.
// Load missing values for the standalone backend without overriding backend/.env.
require("dotenv").config({ path: require("path").join(__dirname, "..", "dashboard", ".env") });
const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("../dashboard/lib/database");
const app = express();
const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:3001").split(",");
app.use(cors({ origin: origins, credentials: true }));
const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
// Keep raw bytes intact for webhook signature verification.
app.post("/api/razorpay-webhook", express.raw({ type: "application/json", limit: "1mb" }), wrap(require("../dashboard/api/razorpay-webhook")));
app.use(express.json({ limit: "10kb" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.all("/api/auth", wrap(require("../frontend/api/auth")));
for (const route of ["profile", "quotes", "summary", "session", "holdings", "positions", "orders", "funds", "razorpay-order", "razorpay-verify", "razorpay-reconcile"]) {
  app.all(`/api/${route}`, wrap(require(`../dashboard/api/${route}`)));
}
for (const [legacy, route] of Object.entries({ allHoldings: "holdings", allPositions: "positions", allOrders: "orders", newOrder: "orders" })) {
  app.all(`/${legacy}`, wrap(require(`../dashboard/api/${route}`)));
}
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({ error: "Request failed" });
});
async function startServer() {
  await connectDatabase();
  return app.listen(Number(process.env.PORT) || 3002, () => console.log("Backend ready"));
}
if (require.main === module) startServer().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { app, startServer };
