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
  orderPricePaise: { type: Number },
  filledAt: { type: Date },
  rejectionReason: { type: String },
  realizedProfitPaise: { type: Number, default: 0 },
  fillSource: { type: String, enum: ["USER", "DEMO", "MIXED"] },
}, { timestamps: true });
orderSchema.index({ userId: 1, requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: "string" } } });
orderSchema.index({ name: 1, status: 1, createdAt: 1 });
orderSchema.index({ userId: 1, status: 1, mode: 1 });
const tradeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, min: 1, required: true, validate: Number.isSafeInteger },
  pricePaise: { type: Number, min: 1, required: true, validate: Number.isSafeInteger },
  buyOrderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sellOrderId: { type: mongoose.Schema.Types.ObjectId },
  buyerUserId: { type: String, required: true },
  sellerUserId: { type: String, required: true },
  source: { type: String, enum: ["USER", "DEMO"], default: "USER" },
}, { timestamps: true, collection: "paper_trades" });
const transferSchema = new mongoose.Schema({
  userId: { type: String, required: true }, requestId: { type: String, required: true },
  type: { type: String, enum: ["ADD", "WITHDRAW"], required: true }, amountPaise: { type: Number, required: true },
  method: { type: String, enum: ["PAPER", "DEMO_QR"], default: "PAPER" },
}, { timestamps: true });
transferSchema.index({ userId: 1, requestId: 1 }, { unique: true });
module.exports = {
  Holding: mongoose.models.Holding || mongoose.model("Holding", holdingSchema),
  Order: mongoose.models.Order || mongoose.model("Order", orderSchema),
  Trade: mongoose.models.Trade || mongoose.model("Trade", tradeSchema),
  Transfer: mongoose.models.Transfer || mongoose.model("Transfer", transferSchema),
};
