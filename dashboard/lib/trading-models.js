const mongoose = require("mongoose");
const holdingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  qty: { type: Number, min: 0, required: true, validate: Number.isSafeInteger },
  costBasisPaise: { type: Number, min: 0, required: true, validate: Number.isSafeInteger },
}, { timestamps: true, collection: "holdings" });
holdingSchema.index({ userId: 1, name: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "string" } } });
const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  requestId: { type: String, required: true },
  name: { type: String, required: true },
  qty: { type: Number, min: 1, required: true, validate: Number.isSafeInteger },
  price: { type: Number, required: true },
  totalPaise: { type: Number, required: true },
  mode: { type: String, enum: ["BUY", "SELL"], required: true },
  status: { type: String, enum: ["OPEN", "PARTIALLY_FILLED", "FILLED", "REJECTED", "CANCELLED"], default: "FILLED" },
  orderType: { type: String, enum: ["MARKET"], default: "MARKET" },
  filledQty: { type: Number, min: 0, default: 0, validate: Number.isSafeInteger },
  estimatedTotalPaise: { type: Number },
  lastMatchTick: { type: Number },
  filledAt: { type: Date },
  rejectionReason: { type: String },
  realizedProfitPaise: { type: Number, default: 0 },
}, { timestamps: true });
orderSchema.index({ userId: 1, requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: "string" } } });
const liquiditySchema = new mongoose.Schema({
  name: { type: String, required: true },
  mode: { type: String, enum: ["BUY", "SELL"], required: true },
  tick: { type: Number, required: true },
  remainingQty: { type: Number, min: 0, required: true, validate: Number.isSafeInteger },
}, { collection: "paper_liquidity", timestamps: true });
liquiditySchema.index({ name: 1, mode: 1, tick: 1 }, { unique: true });
liquiditySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
const transferSchema = new mongoose.Schema({
  userId: { type: String, required: true }, requestId: { type: String, required: true },
  type: { type: String, enum: ["ADD", "WITHDRAW"], required: true }, amountPaise: { type: Number, required: true },
  method: { type: String, enum: ["PAPER", "DEMO_QR"], default: "PAPER" },
}, { timestamps: true });
transferSchema.index({ userId: 1, requestId: 1 }, { unique: true });
module.exports = {
  Holding: mongoose.models.Holding || mongoose.model("Holding", holdingSchema),
  Order: mongoose.models.Order || mongoose.model("Order", orderSchema),
  Liquidity: mongoose.models.Liquidity || mongoose.model("Liquidity", liquiditySchema),
  Transfer: mongoose.models.Transfer || mongoose.model("Transfer", transferSchema),
};
