const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");

let connectionPromise;
const connectDatabase = () => {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not configured");
  if (!connectionPromise) connectionPromise = mongoose.connect(process.env.MONGO_URL);
  return connectionPromise;
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

const createSession = (user) => {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not configured");
  const payload = Buffer.from(JSON.stringify({ sub: user._id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};

const sendAuthenticated = (res, status, user) => {
  res.setHeader("Set-Cookie", `stashflow_session=${createSession(user)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
  return res.status(status).json({ user: { name: user.name, email: user.email } });
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const action = String(req.body?.action || "").toUpperCase();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return res.status(400).json({ error: "Enter a valid email and a password of at least 8 characters." });
  }

  try {
    await connectDatabase();
    if (action === "REGISTER") {
      if (name.length < 2) return res.status(400).json({ error: "Enter your full name." });
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
