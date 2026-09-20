import { GANG_IDENTITIES, spendPremium } from "./premium.js";
import { CONTACT_CLASSES } from "./contacts.js";
import { getCityEventAt } from "./cityDirector.js";
export function normalizeGangIdentity(value = {}) {
  const owned = [...new Set(["street", ...(Array.isArray(value?.owned) ? value.owned : [])])].filter((id) => GANG_IDENTITIES.some((c) => c.id === id));
  return { owned, selected: owned.includes(value?.selected) ? value.selected : "street" };
}
export function buyGangIdentity(player, id, now = Date.now()) {
  if (!player.gang?.joined || player.gang.role !== "Boss") throw Object.assign(new Error("Tylko boss wybiera znak gangu."), { statusCode: 403 });
  const item = GANG_IDENTITIES.find((c) => c.id === id);
  if (!item) throw Object.assign(new Error("Nieznany znak gangu."), { statusCode: 400 });
  const identity = normalizeGangIdentity(player.gang.identity);
  if (!identity.owned.includes(id)) {
    spendPremium(player, item.cost, `Znak gangu: ${item.name}`, now);
    identity.owned.push(id);
  }
  identity.selected = id; player.gang.identity = identity;
  return { message: `Znak gangu: ${item.name}. Bez zmian siły i dochodu.` };
}
export function normalizeGangNetwork(value, weekKey) {
  if (!value || value.weekKey !== weekKey) return { weekKey, members: {}, rewardedAt: null };
  return { weekKey, members: { ...(value.members || {}) }, rewardedAt: Number(value.rewardedAt) || null };
}
export function recordGangSpecialist(gang, memberId, methodId) {
  if (!CONTACT_CLASSES.some((c) => c.id === methodId)) throw new Error("Unknown profession");
  const network = normalizeGangNetwork(gang.contactNetwork, gang.weeklyGoal.weekKey);
  network.members[memberId] = [...new Set([...(network.members[memberId] || []), methodId])];
  gang.contactNetwork = network;
  return getGangNetworkProgress(network);
}

export function getGangNetworkProgress(network = {}) {
  const roster = network.members || {}, assigned = new Map();
  function assign(member, seen) {
    for (const method of roster[member] || []) {
      if (seen.has(method)) continue;
      seen.add(method);
      if (!assigned.has(method) || assign(assigned.get(method), seen)) { assigned.set(method, member); return true; }
    }
    return false;
  }
  for (const member of Object.keys(roster)) assign(member, new Set());
  return { members: Object.keys(roster).length, methods: new Set(Object.values(roster).flat()).size, progress: Math.min(3, assigned.size), rewarded: Boolean(network.rewardedAt) };
}

export function normalizeGangCityResponse(value, weekKey, districtId = "oldtown") {
  const rewardedAt = Number(value?.rewardedAt) || null;
  if (!value || value.weekKey !== weekKey || (value.districtId !== districtId && !rewardedAt)) return { weekKey, districtId, memberIds: [], rewardedAt: null };
  return { weekKey, districtId: value.districtId || districtId, memberIds: [...new Set(Array.isArray(value.memberIds) ? value.memberIds.map(String).filter(Boolean) : [])].slice(0, 25), rewardedAt };
}

export function recordGangCityResponse(gang, memberId) {
  const response = normalizeGangCityResponse(gang.cityResponse, gang.weeklyGoal.weekKey, gang.focusDistrictId);
  const before = response.memberIds.length;
  if (!response.memberIds.includes(String(memberId))) response.memberIds.push(String(memberId));
  gang.cityResponse = response;
  return { progress: Math.min(3, response.memberIds.length), delta: Math.min(3, response.memberIds.length) - Math.min(3, before), rewarded: Boolean(response.rewardedAt) };
}

export function normalizeGangDirectorResponse(value, event = getCityEventAt()) {
  if (!value || value.eventKey !== event.key) return { eventKey: event.key, districtId: event.districtId, memberIds: [], rewardedAt: null };
  return { eventKey: event.key, districtId: event.districtId, memberIds: [...new Set(Array.isArray(value.memberIds) ? value.memberIds.map(String).filter(Boolean) : [])].slice(0, 25), rewardedAt: Number(value.rewardedAt) || null };
}

export function recordGangDirectorResponse(gang, memberId, event = getCityEventAt()) {
  const response = normalizeGangDirectorResponse(gang.directorResponse, event);
  const before = response.memberIds.length;
  if (!response.memberIds.includes(String(memberId))) response.memberIds.push(String(memberId));
  gang.directorResponse = response;
  return { progress: Math.min(3, response.memberIds.length), delta: Math.min(3, response.memberIds.length) - Math.min(3, before), rewarded: Boolean(response.rewardedAt) };
}
