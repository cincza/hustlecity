export const OPERATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function isTransactionalAction(path, method = "POST") {
  if (method !== "POST") return false;
  if (/^\/premium\//.test(path)) return true;
  if (/^\/contacts\//.test(path)) return true;
  if (/^\/city-event\//.test(path)) return true;
  if (/^\/plans\//.test(path)) return true;
  if (/^\/rivals\//.test(path)) return true;
  if (/^\/empire-projects\//.test(path)) return true;
  if (/^\/businesses\//.test(path)) return true;
  if (/^\/escorts\//.test(path)) return true;
  if (/^\/factories\//.test(path)) return true;
  if (/^\/fightclub\/(run|boosts)\//.test(path)) return true;
  if (/^\/contracts\//.test(path)) return true;
  if (/^\/heists\/[^/]+\/execute$/.test(path)) return true;
  if (/^\/player\/(profile\/avatar|gym\/(pass|train)|restaurant\/eat|hospital\/(heal|critical-care\/(public|private))|jail\/bribe)$/.test(path)) return true;
  if (/^\/chat\/(global|prison)$/.test(path)) return true;
  if (/^\/market\/(buy|sell)$/.test(path)) return true;
  return path === "/tasks/claim" || /^\/operations\/(start|advance|execute|resolve|cancel)$/.test(path) || /^\/casino\/(slot|roulette|high-risk|blackjack\/(start|hit|stand))$/.test(path) || /^\/(bank|gang|clubs|dealer)(\/|$)/.test(path) ||
    /^\/social\/(players\/[^/]+\/(attack|bounty)|friends\/[^/]+|messages\/[^/]+)$/.test(path) ||
    /^\/admin\/players\/[^/]+\/(grant-(cash|respect)|adjust|reset|repair|ban)$/.test(path) ||
    path === "/admin/players/delete-account";
}

export function canonicalJson(value) {
  const normalize = (item) => Array.isArray(item) ? item.map(normalize)
    : item && typeof item === "object" ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, normalize(item[key])])) : item;
  return JSON.stringify(normalize(JSON.parse(JSON.stringify(value ?? {}))));
}

export function createOperationKey() {
  const random = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return `${Date.now()}-${random}`;
}
