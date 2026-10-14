const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["ADD", "WITHDRAW"], required: true },
  amount: { type: Number, min: 1, required: true },
  method: { type: String, enum: ["RAZORPAY", "BANK"] },
  paymentId: String,
  orderId: String,
  createdAt: { type: Date, default: Date.now },
});

const fundAccountSchema = new mongoose.Schema({
  accountKey: { type: String, unique: true, required: true },
  balance: { type: Number, min: 0, default: 4043.1 },
  usedMargin: { type: Number, min: 0, default: 3757.3 },
  transactions: { type: [transactionSchema], default: [] },
}, { timestamps: true });

const paymentOrderSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, unique: true, required: true },
  amount: { type: Number, min: 1, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["CREATED", "PAID"], default: "CREATED" },
  paymentId: { type: String, sparse: true, unique: true },
}, { timestamps: true });

const FundAccount = mongoose.models.FundAccount || mongoose.model("FundAccount", fundAccountSchema);
const PaymentOrder = mongoose.models.PaymentOrder || mongoose.model("PaymentOrder", paymentOrderSchema);
const ACCOUNT_KEY = "demo-equity-account";

const responseAccount = (account) => ({
  balance: account.balance,
  usedMargin: account.usedMargin,
  transactions: account.transactions.slice(-20).reverse(),
});

module.exports = { FundAccount, PaymentOrder, ACCOUNT_KEY, responseAccount };
