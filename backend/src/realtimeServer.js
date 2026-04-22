import { WebSocketServer } from "ws";
import { getBearerToken, verifyAuthToken } from "./middleware/auth.js";
import { logInfo, logWarn } from "./utils/logger.js";

const REALTIME_EVENT_TYPE = "state.invalidate";
const SOCKET_OPEN = 1;
const HEARTBEAT_INTERVAL_MS = 30000;

function normalizeGangKey(gangName = "") {
  return String(gangName || "").trim().toLowerCase();
}

function normalizeClubKeys(player) {
  const keys = new Set();
  const sourceId = String(player?.club?.sourceId || "").trim().toLowerCase();
  const visitId = String(player?.club?.visitId || "").trim().toLowerCase();
  if (sourceId) keys.add(sourceId);
  if (visitId) keys.add(visitId);
  return keys;
}

function buildConnectionContext(userRecord) {
  const player = userRecord?.playerData || {};
  return {
    userId: String(userRecord?._id || "").trim(),
    username: String(userRecord?.username || "").trim(),
    gangKey:
      player?.gang?.joined && String(player?.gang?.name || "").trim()
        ? normalizeGangKey(player.gang.name)
        : "",
    clubKeys: normalizeClubKeys(player),
  };
}

function rejectUpgrade(socket, statusCode, message) {
  try {
    socket.write(
      `HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\nContent-Type: text/plain\r\n\r\n${message}`
    );
  } catch (_error) {
  } finally {
    try {
      socket.destroy();
    } catch (_error) {
    }
  }
}

function buildInvalidationEvent(scopes, extra = {}) {
  const safeScopes = Array.from(
    new Set(
      (Array.isArray(scopes) ? scopes : [scopes])
        .map((scope) => String(scope || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
  if (!safeScopes.length) {
    return null;
  }
  return {
    type: REALTIME_EVENT_TYPE,
    scopes: safeScopes,
    reason: String(extra.reason || "sync").trim() || "sync",
    sentAt: Date.now(),
    ...(extra.payload && typeof extra.payload === "object" && !Array.isArray(extra.payload)
      ? { payload: extra.payload }
      : {}),
  };
}

export function createRealtimeServer({ server, findUserById, path = "/realtime" }) {
  const sockets = new Set();
  const socketsByUserId = new Map();
  const wss = new WebSocketServer({ noServer: true });

  function addUserSocket(userId, socket) {
    const current = socketsByUserId.get(userId) || new Set();
    current.add(socket);
    socketsByUserId.set(userId, current);
  }

  function removeUserSocket(userId, socket) {
    const current = socketsByUserId.get(userId);
    if (!current) return;
    current.delete(socket);
    if (!current.size) {
      socketsByUserId.delete(userId);
    }
  }

  function send(socket, event) {
    if (!socket || socket.readyState !== SOCKET_OPEN || !event) {
      return;
    }
    try {
      socket.send(JSON.stringify(event));
    } catch (error) {
      logWarn("realtime", "send-failed", {
        reason: error?.message || "unknown",
        userId: socket.__hcContext?.userId || null,
      });
    }
  }

  function updateSocketContext(socket, userRecord) {
    if (!socket || !userRecord?._id) return;
    const nextContext = buildConnectionContext(userRecord);
    socket.__hcContext = nextContext;
  }

  function syncUserRecord(userRecord) {
    const userId = String(userRecord?._id || "").trim();
    if (!userId) return;
    const userSockets = socketsByUserId.get(userId);
    if (!userSockets?.size) return;
    userSockets.forEach((socket) => updateSocketContext(socket, userRecord));
  }

  function broadcast(event) {
    if (!event) return;
    sockets.forEach((socket) => send(socket, event));
  }

  function notifyUsers(userIds, event) {
    if (!event) return;
    const safeUserIds = Array.from(
      new Set((Array.isArray(userIds) ? userIds : [userIds]).map((value) => String(value || "").trim()).filter(Boolean))
    );
    safeUserIds.forEach((userId) => {
      const userSockets = socketsByUserId.get(userId);
      if (!userSockets?.size) return;
      userSockets.forEach((socket) => send(socket, event));
    });
  }

  function notifyGang(gangName, event) {
    const gangKey = normalizeGangKey(gangName);
    if (!gangKey || !event) return;
    sockets.forEach((socket) => {
      if (socket.__hcContext?.gangKey === gangKey) {
        send(socket, event);
      }
    });
  }

  function notifyClub(clubId, event) {
    const clubKey = String(clubId || "").trim().toLowerCase();
    if (!clubKey || !event) return;
    sockets.forEach((socket) => {
      const clubKeys = socket.__hcContext?.clubKeys;
      if (clubKeys instanceof Set && clubKeys.has(clubKey)) {
        send(socket, event);
      }
    });
  }

  function broadcastInvalidation(scopes, extra = {}) {
    const event = buildInvalidationEvent(scopes, extra);
    broadcast(event);
  }

  function notifyUsersInvalidation(userIds, scopes, extra = {}) {
    const event = buildInvalidationEvent(scopes, extra);
    notifyUsers(userIds, event);
  }

  function notifyGangInvalidation(gangName, scopes, extra = {}) {
    const event = buildInvalidationEvent(scopes, extra);
    notifyGang(gangName, event);
  }

  function notifyClubInvalidation(clubId, scopes, extra = {}) {
    const event = buildInvalidationEvent(scopes, extra);
    notifyClub(clubId, event);
  }

  server.on("upgrade", async (request, socket, head) => {
    let requestUrl;
    try {
      requestUrl = new URL(request.url || "/", "http://localhost");
    } catch (_error) {
      rejectUpgrade(socket, 400, "Bad Request");
      return;
    }

    if (requestUrl.pathname !== path) {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }

    const queryToken = String(requestUrl.searchParams.get("token") || "").trim();
    const token = queryToken || getBearerToken(request.headers.authorization || "");
    if (!token) {
      rejectUpgrade(socket, 401, "Missing bearer token");
      return;
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch (_error) {
      rejectUpgrade(socket, 401, "Invalid or expired token");
      return;
    }

    const userRecord = await findUserById(payload.sub);
    if (!userRecord?.playerData) {
      rejectUpgrade(socket, 401, "User session not found");
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      updateSocketContext(ws, userRecord);
      sockets.add(ws);
      addUserSocket(ws.__hcContext.userId, ws);
      ws.isAlive = true;

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        sockets.delete(ws);
        removeUserSocket(ws.__hcContext?.userId, ws);
      });

      ws.on("error", (error) => {
        logWarn("realtime", "socket-error", {
          reason: error?.message || "unknown",
          userId: ws.__hcContext?.userId || null,
        });
      });

      send(ws, {
        type: "realtime.ready",
        sentAt: Date.now(),
      });
    });
  });

  const heartbeat = setInterval(() => {
    sockets.forEach((socket) => {
      if (socket.isAlive === false) {
        try {
          socket.terminate();
        } catch (_error) {
        }
        return;
      }
      socket.isAlive = false;
      try {
        socket.ping();
      } catch (_error) {
      }
    });
  }, HEARTBEAT_INTERVAL_MS);
  heartbeat.unref?.();

  logInfo("realtime", "server-ready", { path });

  return {
    syncUserRecord,
    broadcast,
    notifyUsers,
    notifyGang,
    notifyClub,
    broadcastInvalidation,
    notifyUsersInvalidation,
    notifyGangInvalidation,
    notifyClubInvalidation,
    close() {
      clearInterval(heartbeat);
      wss.close();
      sockets.forEach((socket) => {
        try {
          socket.close();
        } catch (_error) {
        }
      });
      sockets.clear();
      socketsByUserId.clear();
    },
  };
}
