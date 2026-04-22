import { request } from "./client";

export async function loginSeedUser() {
  return loginUser({ login: "czincza11", password: "1234" });
}

export async function registerUser({ login, email, password }) {
  const normalizedLogin = typeof login === "string" ? login.trim() : "";
  return request("/auth/register", {
    method: "POST",
    body: { login: normalizedLogin, username: normalizedLogin, email, password },
  });
}

export async function loginUser({ login, password }) {
  const normalizedLogin = typeof login === "string" ? login.trim() : "";
  return request("/auth/login", {
    method: "POST",
    body: { login: normalizedLogin, username: normalizedLogin, password },
  });
}

export async function fetchMe(token) {
  return request("/me", { token });
}

export async function fetchMarket(token) {
  return request("/market", { token });
}

export async function fetchHeistsOnline(token) {
  return request("/heists", { token });
}

export async function fetchContractsOnline(token) {
  return request("/contracts", { token });
}

export async function executeHeistOnline(token, heistId) {
  return request(`/heists/${heistId}/execute`, {
    method: "POST",
    token,
  });
}

export async function openGangHeistLobbyOnline(token, heistId, note = "") {
  return request(`/gang/heists/${encodeURIComponent(heistId)}/open`, {
    method: "POST",
    token,
    body: { note },
  });
}

export async function joinGangHeistLobbyOnline(token, heistId) {
  return request(`/gang/heists/${encodeURIComponent(heistId)}/join`, {
    method: "POST",
    token,
  });
}

export async function leaveGangHeistLobbyOnline(token, heistId) {
  return request(`/gang/heists/${encodeURIComponent(heistId)}/leave`, {
    method: "POST",
    token,
  });
}

export async function startGangHeistLobbyOnline(token, heistId) {
  return request(`/gang/heists/${encodeURIComponent(heistId)}/start`, {
    method: "POST",
    token,
  });
}

export async function buyContractItemOnline(token, itemId) {
  return request("/contracts/items/buy", {
    method: "POST",
    token,
    body: { itemId },
  });
}

export async function buyContractCarOnline(token, carId) {
  return request("/contracts/cars/buy", {
    method: "POST",
    token,
    body: { carId },
  });
}

export async function equipContractLoadoutOnline(token, slotId, assetId = null) {
  return request("/contracts/loadout/equip", {
    method: "POST",
    token,
    body: { slotId, assetId },
  });
}

export async function executeContractOnline(token, contractId) {
  return request("/contracts/execute", {
    method: "POST",
    token,
    body: { contractId },
  });
}

export async function rescueGangHeistCrewOnline(token, optionId) {
  return request("/gang/heists/rescue", {
    method: "POST",
    token,
    body: { optionId },
  });
}

export async function buyProductOnline(token, productId, quantity = 1) {
  return request("/market/buy", {
    method: "POST",
    token,
    body: { productId, quantity },
  });
}

export async function sellProductOnline(token, productId, quantity = 1) {
  return request("/market/sell", {
    method: "POST",
    token,
    body: { productId, quantity },
  });
}

export async function depositOnline(token, amount) {
  return request("/bank/deposit", {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function withdrawOnline(token, amount) {
  return request("/bank/withdraw", {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function previewClubPvpOnline(token, payload) {
  return request("/club-pvp/preview", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function previewGangPvpOnline(token, targetGangName) {
  return request("/gang/pvp/preview", {
    method: "POST",
    token,
    body: { targetGangName },
  });
}

export async function executeGangPvpOnline(token, targetGangName) {
  return request("/gang/pvp/attack", {
    method: "POST",
    token,
    body: { targetGangName },
  });
}

export async function fetchCasinoMeta(token) {
  return request("/casino/meta", { token });
}

export async function playSlotOnline(token, bet) {
  return request("/casino/slot", {
    method: "POST",
    token,
    body: { bet },
  });
}

export async function playHighRiskOnline(token, bet) {
  return request("/casino/high-risk", {
    method: "POST",
    token,
    body: { bet },
  });
}

export async function startBlackjackOnline(token, bet) {
  return request("/casino/blackjack/start", {
    method: "POST",
    token,
    body: { bet },
  });
}

export async function hitBlackjackOnline(token) {
  return request("/casino/blackjack/hit", {
    method: "POST",
    token,
  });
}

export async function standBlackjackOnline(token) {
  return request("/casino/blackjack/stand", {
    method: "POST",
    token,
  });
}

export async function updateAvatarOnline(token, avatarId) {
  return request("/player/profile/avatar", {
    method: "POST",
    token,
    body: { avatarId },
  });
}

export async function buyGymPassOnline(token, passId) {
  return request("/player/gym/pass", {
    method: "POST",
    token,
    body: { passId },
  });
}

export async function trainAtGymOnline(token, exerciseId, repetitions = 1) {
  return request("/player/gym/train", {
    method: "POST",
    token,
    body: { exerciseId, repetitions },
  });
}

export async function buyMealOnline(token, itemId) {
  return request("/player/restaurant/eat", {
    method: "POST",
    token,
    body: { itemId },
  });
}

export async function claimTaskOnline(token, taskId) {
  return request("/tasks/claim", {
    method: "POST",
    token,
    body: { taskId },
  });
}

export async function buyBusinessOnline(token, businessId) {
  return request("/businesses/buy", {
    method: "POST",
    token,
    body: { businessId },
  });
}

export async function upgradeBusinessOnline(token, businessId, path) {
  return request("/businesses/upgrade", {
    method: "POST",
    token,
    body: { businessId, path },
  });
}

export async function collectBusinessIncomeOnline(token) {
  return request("/businesses/collect", {
    method: "POST",
    token,
  });
}

export async function buyEscortOnline(token, escortId) {
  return request("/escorts/buy", {
    method: "POST",
    token,
    body: { escortId },
  });
}

export async function assignEscortToStreetOnline(token, escortId, districtId) {
  return request("/escorts/assign", {
    method: "POST",
    token,
    body: { escortId, districtId },
  });
}

export async function pullEscortFromStreetOnline(token, escortId, districtId) {
  return request("/escorts/pull", {
    method: "POST",
    token,
    body: { escortId, districtId },
  });
}

export async function sellEscortOnline(token, escortId) {
  return request("/escorts/sell", {
    method: "POST",
    token,
    body: { escortId },
  });
}

export async function collectEscortIncomeOnline(token) {
  return request("/escorts/collect", {
    method: "POST",
    token,
  });
}

export async function buyFactoryOnline(token, factoryId) {
  return request("/factories/buy", {
    method: "POST",
    token,
    body: { factoryId },
  });
}

export async function buyFactorySupplyOnline(token, supplyId, quantity = 1) {
  return request("/factories/supplies/buy", {
    method: "POST",
    token,
    body: { supplyId, quantity },
  });
}

export async function produceDrugOnline(token, drugId) {
  return request("/factories/produce", {
    method: "POST",
    token,
    body: { drugId },
  });
}

export async function healOnline(token) {
  return request("/player/hospital/heal", {
    method: "POST",
    token,
  });
}

export async function choosePublicCriticalCareOnline(token) {
  return request("/player/hospital/critical-care/public", {
    method: "POST",
    token,
  });
}

export async function choosePrivateClinicOnline(token) {
  return request("/player/hospital/critical-care/private", {
    method: "POST",
    token,
  });
}

export async function bribeOutOfJailOnline(token) {
  return request("/player/jail/bribe", {
    method: "POST",
    token,
  });
}

export async function syncClientStateOnline(token, game) {
  return request("/sync/client-state", {
    method: "POST",
    token,
    body: { game },
  });
}

export async function fetchSocialPlayers(token, query = "") {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  return request(`/social/players${suffix}`, { token });
}

export async function attackPlayerOnline(token, targetUserId) {
  return request(`/social/players/${encodeURIComponent(targetUserId)}/attack`, {
    method: "POST",
    token,
  });
}

export async function grantAdminCashToPlayerOnline(token, targetUserId, amount) {
  return request(`/admin/players/${encodeURIComponent(targetUserId)}/grant-cash`, {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function grantAdminRespectToPlayerOnline(token, targetUserId, amount) {
  return request(`/admin/players/${encodeURIComponent(targetUserId)}/grant-respect`, {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function deleteAdminPlayerAccountOnline(token, login) {
  return request("/admin/players/delete-account", {
    method: "POST",
    token,
    body: { login },
  });
}

export async function addFriendOnline(token, targetUserId) {
  return request(`/social/friends/${encodeURIComponent(targetUserId)}`, {
    method: "POST",
    token,
  });
}

export async function fetchFriendListOnline(token) {
  return request("/social/friends", { token });
}

export async function sendDirectMessageOnline(token, targetUserId, message) {
  return request(`/social/messages/${encodeURIComponent(targetUserId)}`, {
    method: "POST",
    token,
    body: { message },
  });
}

export async function sendQuickMessageOnline(token, targetUserId) {
  return request(`/social/messages/${encodeURIComponent(targetUserId)}`, {
    method: "POST",
    token,
  });
}

export async function fetchMessageListOnline(token) {
  return request("/social/messages", { token });
}

export async function placeBountyOnline(token, targetUserId) {
  return request(`/social/players/${encodeURIComponent(targetUserId)}/bounty`, {
    method: "POST",
    token,
  });
}

export async function fetchRankingsOnline(token) {
  return request("/social/rankings", { token });
}

export async function fetchGlobalChatOnline(token) {
  return request("/chat/global", { token });
}

export async function sendGlobalChatMessageOnline(token, text) {
  return request("/chat/global", {
    method: "POST",
    token,
    body: { text },
  });
}

export async function fetchPrisonChatOnline(token) {
  return request("/chat/prison", { token });
}

export async function sendPrisonChatMessageOnline(token, text) {
  return request("/chat/prison", {
    method: "POST",
    token,
    body: { text },
  });
}

export async function startFightClubRunOnline(token, modeId, styleId) {
  return request("/fightclub/run/start", {
    method: "POST",
    token,
    body: { modeId, styleId },
  });
}

export async function resolveFightClubRunOnline(token) {
  return request("/fightclub/run/fight", {
    method: "POST",
    token,
  });
}

export async function buyFightClubBoostOnline(token, boostId) {
  return request("/fightclub/boosts/buy", {
    method: "POST",
    token,
    body: { boostId },
  });
}

export async function buyDrugFromDealerOnline(token, drugId, quantity = 1) {
  return request("/dealer/buy", {
    method: "POST",
    token,
    body: { drugId, quantity },
  });
}

export async function sellDrugToDealerOnline(token, drugId, quantity = 1) {
  return request("/dealer/sell", {
    method: "POST",
    token,
    body: { drugId, quantity },
  });
}

export async function consumeDrugOnline(token, drugId) {
  return request("/dealer/consume", {
    method: "POST",
    token,
    body: { drugId },
  });
}

export async function visitClubOnline(token, mode, venueId) {
  return request("/clubs/visit", {
    method: "POST",
    token,
    body: { mode, venueId },
  });
}

export async function performClubActionOnline(token, venueId, actionId) {
  return request("/clubs/action", {
    method: "POST",
    token,
    body: { venueId, actionId },
  });
}

export async function searchEscortInClubOnline(token, venueId) {
  return performClubActionOnline(token, venueId, "hunt");
}

export async function claimClubOnline(token, venueId) {
  return request("/clubs/claim", {
    method: "POST",
    token,
    body: { venueId },
  });
}

export async function foundClubOnline(token) {
  return request("/clubs/found", {
    method: "POST",
    token,
  });
}

export async function setClubPlanOnline(token, planId) {
  return request("/clubs/plan", {
    method: "POST",
    token,
    body: { planId },
  });
}

export async function setClubSettingsOnline(token, settings = {}) {
  return request("/clubs/settings", {
    method: "POST",
    token,
    body: settings,
  });
}

export async function runClubNightOnline(token) {
  return request("/clubs/night", {
    method: "POST",
    token,
  });
}

export async function collectClubSafeOnline(token) {
  return request("/clubs/safe/collect", {
    method: "POST",
    token,
  });
}

export async function fortifyClubOnline(token) {
  return request("/clubs/fortify", {
    method: "POST",
    token,
  });
}

export async function moveDrugToClubOnline(token, drugId, quantity = 1) {
  return request("/clubs/stash/move", {
    method: "POST",
    token,
    body: { drugId, quantity },
  });
}

export async function consumeClubDrugOnline(token, venueId, drugId) {
  return request("/clubs/stash/consume", {
    method: "POST",
    token,
    body: { venueId, drugId },
  });
}

export async function createGangOnline(token, gangName) {
  return request("/gang/create", {
    method: "POST",
    token,
    body: { gangName },
  });
}

export async function joinGangOnline(token, invite) {
  return request("/gang/join", {
    method: "POST",
    token,
    body: { invite },
  });
}

export async function leaveGangOnline(token) {
  return request("/gang/leave", {
    method: "POST",
    token,
  });
}

export async function fetchGangDirectoryOnline(token) {
  return request("/gangs", { token });
}

export async function invitePlayerToGangOnline(token, targetUserId) {
  return request("/gang/invite", {
    method: "POST",
    token,
    body: { targetUserId },
  });
}

export async function sendGangAllianceOfferOnline(token, targetGangName) {
  return request("/gang/alliance", {
    method: "POST",
    token,
    body: { targetGangName },
  });
}

export async function updateGangSettingsOnline(token, settings) {
  return request("/gang/settings", {
    method: "POST",
    token,
    body: settings,
  });
}

export async function updateGangMemberRoleOnline(token, targetUserId, role) {
  return request("/gang/members/role", {
    method: "POST",
    token,
    body: { targetUserId, role },
  });
}

export async function deleteGangOnline(token) {
  return request("/gang/delete", {
    method: "POST",
    token,
  });
}

export async function contributeGangOnline(token, amount) {
  return request("/gang/tribute", {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function setGangFocusOnline(token, districtId) {
  return request("/gang/focus", {
    method: "POST",
    token,
    body: { districtId },
  });
}

export async function investGangProjectOnline(token, projectId) {
  return request("/gang/projects/invest", {
    method: "POST",
    token,
    body: { projectId },
  });
}

export async function claimGangGoalOnline(token) {
  return request("/gang/goals/claim", {
    method: "POST",
    token,
  });
}

export async function upgradeGangMembersOnline(token) {
  return request("/gang/members/upgrade", {
    method: "POST",
    token,
  });
}

export async function startOperationOnline(token, operationId) {
  return request("/operations/start", {
    method: "POST",
    token,
    body: { operationId },
  });
}

export async function advanceOperationOnline(token, choiceId) {
  return request("/operations/advance", {
    method: "POST",
    token,
    body: { choiceId },
  });
}

export async function executeOperationPlanOnline(token) {
  return request("/operations/execute", {
    method: "POST",
    token,
  });
}
