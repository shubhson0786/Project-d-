const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["ADD", "WITHDRAW", "BUY", "SELL"], required: true },
  amount: { type: Number, min: 1, required: true },
  method: { type: String, enum: ["RAZORPAY", "BANK", "PAPER", "DEMO_QR", "TRADE"] },
  symbol: String,
  qty: Number,
  requestId: String,
  paymentId: String,
  orderId: String,
  createdAt: { type: Date, default: Date.now },
});

const fundAccountSchema = new mongoose.Schema({
  accountKey: { type: String, unique: true, required: true },
  balance: { type: Number, min: 0, default: 0 },
  balancePaise: { type: Number, min: 0, validate: Number.isSafeInteger },
  realizedProfitPaise: { type: Number, default: 0 },
  usedMargin: { type: Number, min: 0, default: 0 },
  transactions: { type: [transactionSchema], default: [] },
}, { timestamps: true });

const paymentOrderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  razorpayOrderId: { type: String, unique: true, required: true },
  amount: { type: Number, min: 1, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["CREATED", "PAID"], default: "CREATED" },
  paymentId: { type: String, sparse: true, unique: true },
}, { timestamps: true });

const FundAccount = mongoose.models.FundAccount || mongoose.model("FundAccount", fundAccountSchema);
const PaymentOrder = mongoose.models.PaymentOrder || mongoose.model("PaymentOrder", paymentOrderSchema);

const responseAccount = (account) => ({
  balance: (account.balancePaise == null ? Math.round(account.balance * 100) : account.balancePaise) / 100,
  realizedProfit: (account.realizedProfitPaise || 0) / 100,
  paymentMode: process.env.PAYMENT_MODE === "razorpay_test" ? "razorpay_test" : "paper",
  usedMargin: account.usedMargin,
  transactions: account.transactions.slice(-20).reverse(),
});

module.exports = { FundAccount, PaymentOrder, responseAccount };
