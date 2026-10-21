const crypto = require("crypto");
const COOKIE = "stashflow_session";
function secret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("Set SESSION_SECRET to at least 32 characters");
  return process.env.SESSION_SECRET;
}
function sign(claims, purpose, ttl) {
  const payload = Buffer.from(JSON.stringify({ ...claims, purpose, exp: Date.now() + ttl })).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}
function verify(token, purpose) {
  try {
    const [payload, signature, extra] = String(token || "").split(".");
    if (!payload || !signature || extra) return null;
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (claims.purpose !== purpose || !Number.isFinite(claims.exp) || claims.exp <= Date.now() || !/^[a-f0-9]{24}$/i.test(claims.sub)) return null;
    return claims;
  } catch { return null; }
}
function cookie(token, maxAge = 604800) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
function requireUser(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = String(req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const user = verify(token, "session");
  if (!user) { res.status(401).json({ error: "Please log in." }); return null; }
  if (!["GET", "HEAD"].includes(req.method) && req.headers.origin) {
    const allowed = (process.env.CLIENT_ORIGIN || "").split(",").filter(Boolean);
    const host = req.headers.host;
    if (!allowed.includes(req.headers.origin) && ![`https://${host}`, `http://${host}`].includes(req.headers.origin)) {
      res.status(403).json({ error: "Origin not allowed" }); return null;
    }
  }
  return user;
}
module.exports = { sign, verify, cookie, requireUser };
