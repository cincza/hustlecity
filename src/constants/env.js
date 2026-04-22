const PRODUCTION_API_BASE_URL = "https://hustle-city-api.onrender.com";
const LOCAL_DEV_API_BASE_URL = "http://127.0.0.1:4000";

function isPrivateIpv4Host(hostname) {
  if (typeof hostname !== "string" || !hostname.trim()) {
    return false;
  }

  const safeHost = hostname.trim().toLowerCase();
  if (/^10(?:\.\d{1,3}){3}$/.test(safeHost)) {
    return true;
  }
  if (/^192\.168(?:\.\d{1,3}){2}$/.test(safeHost)) {
    return true;
  }

  const match172 = safeHost.match(/^172\.(\d{1,3})(?:\.\d{1,3}){2}$/);
  if (match172) {
    const secondOctet = Number(match172[1]);
    return Number.isFinite(secondOctet) && secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

function normalizeApiBaseUrl(value) {
  if (typeof value !== "string") {
    return PRODUCTION_API_BASE_URL;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return PRODUCTION_API_BASE_URL;
  }

  return trimmed.replace(/\/+$/, "");
}

function shouldUseLocalDevApi() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (typeof window === "undefined" || !window?.location) {
    return false;
  }

  const hostname = String(window.location.hostname || "").trim().toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || isPrivateIpv4Host(hostname);
}

function getLocalDevApiBaseUrl() {
  if (typeof window === "undefined" || !window?.location) {
    return LOCAL_DEV_API_BASE_URL;
  }

  const hostname = String(window.location.hostname || "").trim().toLowerCase();
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_DEV_API_BASE_URL;
  }

  if (isPrivateIpv4Host(hostname)) {
    return `http://${hostname}:4000`;
  }

  return LOCAL_DEV_API_BASE_URL;
}

export const API_BASE_URL = shouldUseLocalDevApi()
  ? getLocalDevApiBaseUrl()
  : normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
