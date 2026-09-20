export class ApiError extends Error {
  constructor(message, status = 0, code = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isInvalidSession(error) {
  return error?.status === 401;
}

export async function requestJson(baseUrl, path, options = {}, fetcher = fetch) {
  if (!baseUrl || typeof baseUrl !== "string") throw new ApiError("Brak adresu serwera gry.");
  const method = options.method || "GET";
  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number.isFinite(options.timeoutMs) ? options.timeoutMs : 10000);
    let response;
    let raw;
    try {
      response = await fetcher(`${baseUrl}${path}`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}) },
        method,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      raw = await response.text();
    } catch (error) {
      throw new ApiError(error?.name === "AbortError" ? "Serwer zbyt długo odpowiada. Spróbuj ponownie." : "Nie można połączyć się z serwerem gry.");
    } finally {
      clearTimeout(timeout);
    }
    // Retry reads only. Repeating an economic action could charge the player twice.
    if (response.status === 409 && method === "GET" && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 120 * (attempt + 1)));
      continue;
    }
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new ApiError("Serwer zwrócił nieprawidłową odpowiedź. Spróbuj ponownie.", response.status, "invalid_response");
    }
    if (!response.ok) throw new ApiError(data.error || `Błąd serwera (${response.status}).`, response.status, data.code);
    return data;
  }
}
