const mongoose = require("mongoose");

let connectionPromise;

function connectDatabase() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not configured");
  if (!connectionPromise) connectionPromise = mongoose.connect(process.env.MONGO_URL).then(async connection => {
    // Build uniqueness indexes before accepting concurrent trading requests.
    const trading = require("./trading-models");
    const funds = require("./funds");
    await Promise.all([...Object.values(trading), funds.FundAccount, funds.PaymentOrder].map(model => model.init()));
    return connection;
  }).catch(error => { connectionPromise = undefined; throw error; });
  return connectionPromise;
}

module.exports = { connectDatabase };
