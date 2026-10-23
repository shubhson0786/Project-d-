const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");

let connectionPromise;
const connectDatabase = () => {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not configured");
  if (!connectionPromise) connectionPromise = mongoose.connect(process.env.MONGO_URL).catch(error => { connectionPromise = undefined; throw error; });
  return connectionPromise;
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  resetCodeHash: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

const { sign } = require("../lib/auth");
const sendAuthenticated = (res, status, user) => {
  res.setHeader("Cache-Control", "no-store");
  const profile = { sub: String(user._id), name: user.name, email: user.email };
  return res.status(status).json({ user: { name: user.name, email: user.email }, handoff: sign(profile, "handoff", 60000) });
};

const hashResetCode = (email, code) => crypto.createHmac("sha256", process.env.SESSION_SECRET).update(`${email}:${code}`).digest("hex");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const action = String(req.body?.action || "").toUpperCase();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (["REGISTER", "LOGIN"].includes(action) && (password.length < 8 || Buffer.byteLength(password, "utf8") > 72)) {
    return res.status(400).json({ error: "Enter a valid email and a password of at least 8 characters." });
  }

  try {
    await connectDatabase();
    if (action === "REQUEST_RESET") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter your registered email address." });
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "No account was found with this email." });
      const resetCode = crypto.randomInt(100000, 1000000).toString();
      user.resetCodeHash = hashResetCode(email, resetCode);
      user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      return res.json({ message: "Reset code created. It expires in 10 minutes.", resetCode });
    }

    if (action === "RESET_PASSWORD") {
      const resetCode = String(req.body?.resetCode || "").trim();
      const newPassword = String(req.body?.newPassword || "");
      if (!/^\d{6}$/.test(resetCode) || newPassword.length < 8) return res.status(400).json({ error: "Enter the 6-digit code and a password of at least 8 characters." });
      const user = await User.findOne({ email });
      const validCode = user && user.resetCodeExpires > new Date() && user.resetCodeHash === hashResetCode(email, resetCode);
      if (!validCode) return res.status(400).json({ error: "This reset code is incorrect or has expired." });
      user.passwordHash = await bcrypt.hash(newPassword, 12);
      user.resetCodeHash = null;
      user.resetCodeExpires = null;
      await user.save();
      return res.json({ message: "Password updated. You can now log in." });
    }

    if (action === "REGISTER") {
      if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Enter your full name." });
      const exists = await User.exists({ email });
      if (exists) return res.status(409).json({ error: "An account already exists. Please log in." });
      const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
      return sendAuthenticated(res, 201, user);
    }

    if (action === "LOGIN") {
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Incorrect email or password." });
      }
      return sendAuthenticated(res, 200, user);
    }

    return res.status(400).json({ error: "Choose login or registration." });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "An account already exists. Please log in." });
    console.error("Authentication error", error);
    return res.status(500).json({ error: "Authentication is temporarily unavailable." });
  }
};
