import { createGangState, normalizeGangState } from "../../../shared/gangProjects.js";

const SHARED_GANG_FIELDS = [
  "identity", "contactNetwork", "cityResponse", "directorResponse", "memberCapLevel", "maxMembers",
  "territory", "influence", "vault", "inviteRespectMin", "gearScore", "jailedCrew",
  "crewLockdownUntil", "focusDistrictId", "projects", "weeklyGoal", "weeklyProgress",
  "weeklyGoalClaimedAt", "jobBoard", "jobProgress", "jobRewardedAt", "activeHeistLobby",
  "lastHeistReport", "protectedClub", "chat",
];

function gangKey(value) {
  return String(value || "").trim().toLowerCase();
}

function scrubIdentity(value, userId) {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== userId && entry?.userId !== userId && entry?.id !== userId)
      .map((entry) => scrubIdentity(entry, userId));
  }
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === userId) continue;
    if (["userId", "memberId", "playerId", "ownerUserId"].includes(key) && entry === userId) continue;
    output[key] = scrubIdentity(entry, userId);
  }
  return output;
}

function buildSharedGangState(gang, deletedUserId) {
  const normalized = normalizeGangState(gang || createGangState());
  return Object.fromEntries(SHARED_GANG_FIELDS.map((field) => [field, scrubIdentity(structuredClone(normalized[field]), deletedUserId)]));
}

function roleWeight(role) {
  if (role === "Vice Boss") return 0;
  if (role === "Zaufany") return 1;
  return 2;
}

function chooseSuccessor(records) {
  return [...records].sort((left, right) => {
    const roleDelta = roleWeight(left.playerData?.gang?.role) - roleWeight(right.playerData?.gang?.role);
    if (roleDelta) return roleDelta;
    const respectDelta = Number(right.playerData?.profile?.respect || 0) - Number(left.playerData?.profile?.respect || 0);
    if (respectDelta) return respectDelta;
    return String(left.username || "").localeCompare(String(right.username || ""), "pl");
  })[0] || null;
}

function scrubPlayerReferences(player, target) {
  let changed = false;
  player.online ||= { friends: [], messages: [] };
  const friends = Array.isArray(player.online.friends) ? player.online.friends : [];
  const nextFriends = friends.filter((entry) => entry?.id !== target._id);
  if (nextFriends.length !== friends.length) { player.online.friends = nextFriends; changed = true; }
  const messages = Array.isArray(player.online.messages) ? player.online.messages : [];
  const nextMessages = messages.filter((entry) => entry?.fromUserId !== target._id && entry?.toUserId !== target._id);
  if (nextMessages.length !== messages.length) { player.online.messages = nextMessages; changed = true; }
  const targets = player.cooldowns?.playerAttackTargets;
  if (targets && Object.hasOwn(targets, target._id)) { delete targets[target._id]; changed = true; }
  return changed;
}

export function prepareAccountDeletion(records, targetUserId, now = Date.now()) {
  const target = records.find((entry) => entry?._id === targetUserId);
  if (!target?.playerData) throw Object.assign(new Error("Target player not found"), { statusCode: 404 });
  const changedRecords = new Set();
  const deletedGang = target.playerData.gang?.joined ? String(target.playerData.gang.name || "").trim() : "";
  const members = deletedGang
    ? records.filter((entry) => entry?._id !== targetUserId && entry?.playerData?.gang?.joined && gangKey(entry.playerData.gang.name) === gangKey(deletedGang))
    : [];
  const targetWasBoss = target.playerData.gang?.role === "Boss";
  const successor = targetWasBoss ? chooseSuccessor(members) : null;
  const sharedSource = targetWasBoss ? target.playerData.gang : members.find((entry) => entry.playerData?.gang?.role === "Boss")?.playerData?.gang || members[0]?.playerData?.gang;
  const shared = sharedSource ? buildSharedGangState(sharedSource, targetUserId) : null;

  for (const record of records) {
    if (!record?.playerData || record._id === targetUserId) continue;
    const player = record.playerData;
    let changed = scrubPlayerReferences(player, target);
    const sameGang = deletedGang && player.gang?.joined && gangKey(player.gang.name) === gangKey(deletedGang);
    if (sameGang && shared) {
      const personal = normalizeGangState(player.gang);
      player.gang = normalizeGangState({
        ...personal,
        ...structuredClone(shared),
        joined: true,
        name: deletedGang,
        role: record._id === successor?._id ? "Boss" : personal.role,
        members: members.length,
      });
      changed = true;
    }
    if (deletedGang && !members.length && Array.isArray(player.gang?.invites)) {
      const invites = player.gang.invites.filter((invite) => gangKey(invite?.gangName) !== gangKey(deletedGang));
      if (invites.length !== player.gang.invites.length) { player.gang.invites = invites; changed = true; }
    }
    if (changed) changedRecords.add(record);
  }

  return {
    target,
    changedRecords: [...changedRecords],
    successorId: successor?._id || null,
    gangName: deletedGang || null,
    deletedAt: now,
  };
}
