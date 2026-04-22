import { API_BASE_URL } from "../../constants/env";

const READY_STATE_OPEN = 1;

function buildRealtimeUrl(token) {
  const safeToken = String(token || "").trim();
  if (!safeToken || !API_BASE_URL) {
    return null;
  }

  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/realtime`;
  url.searchParams.set("token", safeToken);
  return url.toString();
}

function getReconnectDelay(attempt) {
  const safeAttempt = Math.max(0, Math.floor(Number(attempt || 0)));
  return Math.min(12000, 1200 * Math.max(1, 2 ** Math.min(safeAttempt, 3)));
}

export function createRealtimeClient({ token, onEvent, onStatusChange }) {
  const websocketUrl = buildRealtimeUrl(token);
  if (!websocketUrl) {
    onStatusChange?.("unavailable");
    return {
      close() {},
      reconnect() {},
    };
  }

  let socket = null;
  let closedManually = false;
  let reconnectTimer = null;
  let reconnectAttempt = 0;

  const updateStatus = (status) => {
    onStatusChange?.(status);
  };

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closedManually) return;
    clearReconnectTimer();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, getReconnectDelay(reconnectAttempt));
  };

  const connect = () => {
    if (closedManually) return;
    clearReconnectTimer();
    updateStatus(reconnectAttempt > 0 ? "reconnecting" : "connecting");

    socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
      reconnectAttempt = 0;
      updateStatus("online");
    };

    socket.onmessage = (event) => {
      if (!event?.data) return;
      try {
        const payload = JSON.parse(event.data);
        onEvent?.(payload);
      } catch (_error) {
      }
    };

    socket.onerror = () => {
      updateStatus("error");
    };

    socket.onclose = () => {
      if (closedManually) {
        updateStatus("closed");
        return;
      }
      reconnectAttempt += 1;
      updateStatus("offline");
      scheduleReconnect();
    };
  };

  connect();

  return {
    close() {
      closedManually = true;
      clearReconnectTimer();
      if (socket && socket.readyState === READY_STATE_OPEN) {
        try {
          socket.close(1000, "client-close");
        } catch (_error) {
        }
        return;
      }
      try {
        socket?.close?.();
      } catch (_error) {
      }
    },
    reconnect() {
      if (closedManually) return;
      reconnectAttempt = 0;
      clearReconnectTimer();
      try {
        socket?.close?.();
      } catch (_error) {
      }
      connect();
    },
  };
}
