const { sign, verify, cookie, requireUser } = require("../lib/auth");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") {
    const user = verify(req.body?.handoff, "handoff");
    if (!user) return res.status(401).json({ error: "Login link expired. Please log in again." });
    res.setHeader("Set-Cookie", cookie(sign({ sub: user.sub, name: user.name, email: user.email }, "session", 604800000)));
    return res.json({ user: { id: user.sub, name: user.name, email: user.email } });
  }
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", cookie("", 0));
    return res.json({ ok: true });
  }
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.json({ user: { id: user.sub, name: user.name, email: user.email } });
};
