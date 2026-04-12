import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hustle-city-dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

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
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const payload = verifyAuthToken(token);
      const userRecord = await findUserById(payload.sub);
      if (!userRecord?.playerData) {
        res.status(401).json({ error: "Unauthorized" });
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
    } catch (_error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}
