const PRODUCTION_API_BASE_URL = "https://hustle-city-api.onrender.com";

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

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
