const { Schema } = require("mongoose");

const OrdersSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, uppercase: true },
    qty: { type: Number, required: true, min: 1, validate: Number.isInteger },
    price: { type: Number, required: true, min: 0.01 },
    mode: { type: String, required: true, enum: ["BUY", "SELL"] },
  },
  { timestamps: true }
);

module.exports = { OrdersSchema };
