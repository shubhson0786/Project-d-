const { FundAccount } = require("./funds");
function fail(message, status = 400) { return Object.assign(new Error(message), { status }); }
function requestId(value) { if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(value)) throw fail("A valid requestId is required. Retry with the same ID."); return value; }
function paise(value) {
  const number = Number(value);
  const amount = Math.round(number * 100);
  if (!Number.isFinite(number) || !Number.isSafeInteger(amount) || amount < 100 || amount > 50000000 || Math.abs(number * 100 - amount) > 0.00001) throw fail("Enter an amount between ₹1 and ₹5,00,000, with at most two decimal places.");
  return amount;
}
async function ensureAccount(userId) {
  let account;
  try {
    account = await FundAccount.findOneAndUpdate({ accountKey: userId },
      { $setOnInsert: { balance: 0, balancePaise: 0, usedMargin: 0, realizedProfitPaise: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true });
  } catch (error) { if (error.code !== 11000) throw error; account = await FundAccount.findOne({ accountKey: userId }); }
  // One-time conversion for accounts created before integer money was introduced.
  if (account.balancePaise == null) {
    await FundAccount.updateOne({ accountKey: userId, balancePaise: { $exists: false } }, { $set: { balancePaise: Math.round(account.balance * 100), usedMargin: 0 } });
    account = await FundAccount.findOne({ accountKey: userId });
  }
  return account;
}
module.exports = { fail, requestId, paise, ensureAccount };
