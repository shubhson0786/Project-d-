require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");

const PORT = Number(process.env.PORT) || 3002;
const MONGO_URL = process.env.MONGO_URL;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/allHoldings", async (req, res, next) => {
  try {
    const holdings = await HoldingsModel.find().lean();
    res.json(holdings);
  } catch (error) {
    next(error);
  }
});

app.get("/allPositions", async (req, res, next) => {
  try {
    const positions = await PositionsModel.find().lean();
    res.json(positions);
  } catch (error) {
    next(error);
  }
});

app.get("/allOrders", async (req, res, next) => {
  try {
    const orders = await OrdersModel.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

app.post("/newOrder", async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim().toUpperCase() : "";
    const qty = Number(req.body.qty);
    const price = Number(req.body.price);
    const mode = typeof req.body.mode === "string" ? req.body.mode.toUpperCase() : "";

    if (!name || !Number.isInteger(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0 || !["BUY", "SELL"].includes(mode)) {
      return res.status(400).json({
        error: "name, a positive whole-number qty, a positive price, and mode BUY or SELL are required",
      });
    }

    const order = await OrdersModel.create({ name, qty, price, mode });
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: "Internal server error" });
});

async function startServer() {
  if (!MONGO_URL) {
    throw new Error("MONGO_URL is not configured");
  }

  await mongoose.connect(MONGO_URL);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
