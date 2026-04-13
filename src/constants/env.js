const DEV_LOCALHOST_API_BASE_URL = "http://localhost:4000";

function normalizeApiBaseUrl(value) {
  if (typeof value !== "string") {
    return DEV_LOCALHOST_API_BASE_URL;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEV_LOCALHOST_API_BASE_URL;
  }

  return trimmed.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
export const IS_DEV_LOCAL_API_FALLBACK = API_BASE_URL === DEV_LOCALHOST_API_BASE_URL;
