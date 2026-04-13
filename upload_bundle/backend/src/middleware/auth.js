import jwt from "jsonwebtoken";

const JWT_SECRET = typeof process.env.JWT_SECRET === "string" ? process.env.JWT_SECRET.trim() : "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET env is required");
}

export function getBearerToken(header = "") {
  return typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      username: user.username,
      email: user.email || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function createAuthMiddleware({
  findUserById,
  syncPlayerState,
  syncCasinoDay,
  markUserActive,
}) {
  return async function auth(req, res, next) {
    try {
      const token = getBearerToken(req.headers.authorization || "");
      if (!token) {
        res.status(401).json({ error: "Missing bearer token" });
        return;
      }

      let payload;
      try {
        payload = verifyAuthToken(token);
      } catch (_error) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      const userRecord = await findUserById(payload.sub);
      if (!userRecord?.playerData) {
        res.status(401).json({ error: "User session not found" });
        return;
      }

      syncPlayerState(userRecord.playerData);
      syncCasinoDay(userRecord.playerData);
      markUserActive(userRecord._id);

      req.auth = payload;
      req.user = {
        id: userRecord._id,
        username: userRecord.username,
        email: userRecord.email || null,
      };
      req.userRecord = userRecord;
      req.player = userRecord.playerData;
      next();
    } catch (error) {
      res.status(401).json({ error: error?.message || "Unauthorized" });
    }
  };
}
