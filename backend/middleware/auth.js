const { auth } = require("../config/firebase");

// Verifies the Firebase ID token sent in the Authorization header.
// Attaches req.uid and req.userEmail on success.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "You must be signed in to do that." });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

// Like requireAuth, but doesn't fail the request if no token is present —
// used on the download endpoint so both guests and signed-in users can use it,
// while signed-in users additionally get history saved.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email;
  } catch {
    // Invalid token on an optional route — just proceed unauthenticated
  }
  next();
}

// Restricts a route to UIDs listed in ADMIN_UIDS
function requireAdmin(req, res, next) {
  const adminUids = (process.env.ADMIN_UIDS || "").split(",").map((s) => s.trim());
  if (!req.uid || !adminUids.includes(req.uid)) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
