import { canonicalJson, createOperationKey } from "./transactions.js";

// Storage names contain neither credentials nor the request body. This is a namespace,
// not a security hash; ownership and payload identity are checked by the server.
function storageHash(text) {
  return [0x811c9dc5, 0x1234567, 0x7654321, 0x9e3779b9].map((seed) => {
    let value = seed;
    for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
    return (value >>> 0).toString(16).padStart(8, "0");
  }).join("");
}

function sessionOwner(token) {
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const owner = JSON.parse(atob(encoded)).sub;
    if (typeof owner === "string" && owner) return owner;
  } catch {}
  return token;
}

export function createTransactionClient({ storage, send, createKey = createOperationKey, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  const inFlight = new Map();
  return function perform(path, options) {
    const slot = `hustle.operation.${storageHash(sessionOwner(options.token || ""))}.${storageHash(path + canonicalJson(options.body))}`;
    if (inFlight.has(slot)) return inFlight.get(slot);
    const promise = (async () => {
      let key;
      try {
        key = await storage.get(slot);
        if (!key) { key = createKey(); await storage.set(slot, key); }
      } catch {
        throw new Error("Nie można zapisać potwierdzenia operacji na urządzeniu. Zwolnij miejsce i spróbuj ponownie.");
      }
      try {
        for (let attempt = 0; ; attempt++) {
          try {
            const result = await send(path, { ...options, idempotencyKey: key });
            // If cleanup fails, keep the same key: a future retry will remain safe.
            try { await storage.remove(slot); } catch {}
            return result;
          } catch (error) {
            const uncertain = !error.status || error.status >= 500 || error.code === "invalid_response" || error.code === "operation_in_progress";
            if (!uncertain || attempt >= 1) throw error;
            await wait(250);
          }
        }
      } catch (error) {
        if (error.status >= 400 && error.status < 500 && error.code !== "operation_in_progress") {
          try { await storage.remove(slot); } catch {}
        }
        throw error;
      }
    })().finally(() => inFlight.delete(slot));
    inFlight.set(slot, promise);
    return promise;
  };
}
