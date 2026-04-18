import { API_BASE_URL } from "../../constants/env";

export async function request(path, options = {}) {
  const url = `${API_BASE_URL || ""}${path}`;
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 10000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  if (!API_BASE_URL || typeof API_BASE_URL !== "string") {
    clearTimeout(timeout);
    throw new Error("API_BASE_URL nie jest ustawione.");
  }

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      method: options.method || "GET",
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Backend za dlugo odpowiada.");
    }
    throw new Error("Brak polaczenia z backendem.");
  } finally {
    clearTimeout(timeout);
  }

  const raw = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (_error) {
      const looksLikeHtml =
        contentType.includes("text/html") ||
        /^\s*</.test(raw) ||
        /Cannot (GET|POST|PUT|DELETE)/i.test(raw);
      data = {
        error: looksLikeHtml
          ? `Endpoint ${path} zwrocil HTML zamiast JSON. Sprawdz API_BASE_URL (${API_BASE_URL}).`
          : raw,
      };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}
