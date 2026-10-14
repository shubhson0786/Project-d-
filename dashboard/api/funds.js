const { connectDatabase } = require("./_database");
const { FundAccount, ACCOUNT_KEY, responseAccount } = require("./_funds");

module.exports = async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDatabase();
    if (req.method === "GET") {
      const account = await FundAccount.findOneAndUpdate(
        { accountKey: ACCOUNT_KEY },
        { $setOnInsert: { balance: 4043.1, usedMargin: 3757.3 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return res.json(responseAccount(account));
    }

    const type = typeof req.body.type === "string" ? req.body.type.toUpperCase() : "";
    const method = typeof req.body.method === "string" ? req.body.method.toUpperCase() : "";
    const amount = Math.round(Number(req.body.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 1 || type !== "WITHDRAW" || method !== "BANK") {
      return res.status(400).json({ error: "Deposits must be completed through Razorpay Checkout." });
    }
    const query = { accountKey: ACCOUNT_KEY, balance: { $gte: amount } };
    const account = await FundAccount.findOneAndUpdate(
      query,
      { $inc: { balance: -amount }, $push: { transactions: { type, amount, method, createdAt: new Date() } } },
      { new: true }
    );
    if (!account) return res.status(400).json({ error: "Insufficient available cash for this withdrawal." });
    return res.json(responseAccount(account));
  } catch (error) {
    console.error("Funds API error", error);
    return res.status(500).json({ error: "Failed to update funds." });
  }
};
