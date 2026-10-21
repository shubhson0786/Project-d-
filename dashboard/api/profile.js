const mongoose = require("mongoose");
const { requireUser } = require("../lib/auth");
const { connectDatabase } = require("../lib/database");
// Use the same user records as registration, with an explicit safe projection.
const schema = new mongoose.Schema({
  name: String, email: String,
  phone: { type: String, default: "" }, city: { type: String, default: "" },
  occupation: { type: String, default: "" }, bio: { type: String, default: "" },
}, { timestamps: true, collection: "users" });
const User = mongoose.models.ProfileUser || mongoose.model("ProfileUser", schema);
const fields = "name email phone city occupation bio createdAt";
function present(user) {
  return { id: String(user._id), name: user.name, email: user.email, phone: user.phone || "", city: user.city || "", occupation: user.occupation || "", bio: user.bio || "", createdAt: user.createdAt };
}
module.exports = async (req, res) => {
  const session = requireUser(req, res); if (!session) return;
  if (!["GET", "PATCH"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  try {
    let update;
    if (req.method === "PATCH") {
      const limits = { name: 80, phone: 24, city: 80, occupation: 100, bio: 240 };
      const body = req.body;
      if (!body || Array.isArray(body) || typeof body !== "object" || !Object.keys(body).length || Object.keys(body).some(key => !Object.hasOwn(limits, key))) return res.status(400).json({ error: "Only name, phone, city, occupation and bio can be edited." });
      update = {};
      for (const key of Object.keys(body)) {
        if (typeof body[key] !== "string" || body[key].trim().length > limits[key]) return res.status(400).json({ error: `Enter a valid ${key} (up to ${limits[key]} characters).` });
        update[key] = body[key].trim();
        if (key !== "bio" && /[\x00-\x1f]/.test(update[key])) return res.status(400).json({ error: `Enter a valid ${key}.` });
      }
      if (update.name !== undefined && update.name.length < 2) return res.status(400).json({ error: "Enter your full name." });
      if (update.phone && (!/^\+?[0-9 ()-]+$/.test(update.phone) || update.phone.replace(/\D/g, "").length < 8 || update.phone.replace(/\D/g, "").length > 15)) return res.status(400).json({ error: "Enter a valid phone number." });
    }
    await connectDatabase();
    const user = update
      ? await User.findOneAndUpdate({ _id: session.sub }, { $set: update }, { new: true, runValidators: true }).select(fields).lean()
      : await User.findById(session.sub).select(fields).lean();
    if (!user) return res.status(404).json({ error: "User profile not found. Please sign in again." });
    return res.json(present(user));
  } catch (error) {
    console.error("Profile API failed", error.message);
    return res.status(500).json({ error: "Could not load or save your profile. Please retry." });
  }
};
