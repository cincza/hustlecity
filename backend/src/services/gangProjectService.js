import {
  createGangState,
  ensureGangWeeklyGoal,
  getGangProjectById,
  getGangProjectCost,
  getGangProjectEffects,
  getGangProjectLevel,
  getGangWeeklyProgress,
  incrementGangGoalProgress,
  normalizeGangState,
} from "../../../shared/gangProjects.js";
import { DISTRICTS, findDistrictById, getDistrictSummaries } from "../../../shared/districts.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

export function ensurePlayerGangState(player, now = Date.now()) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }
  player.gang = ensureGangWeeklyGoal(normalizeGangState(player.gang || createGangState()), now);
}

export function syncGangDerivedState(player, now = Date.now()) {
  ensurePlayerGangState(player, now);
  const summaries = getDistrictSummaries(player?.city);
  const controlled = summaries.filter((entry) => entry.controlState.id === "control").length;
  const totalInfluence = summaries.reduce((sum, entry) => sum + Number(entry.influence || 0), 0);
  player.gang.territory = player.gang.joined ? controlled : 0;
  player.gang.influence = player.gang.joined ? Math.floor(totalInfluence) : 0;
  player.gang = ensureGangWeeklyGoal(player.gang, now);
  return player.gang;
}

export function createGangForPlayer(player, gangName, now = Date.now(), options = {}) {
  ensurePlayerGangState(player, now);
  if (player.gang.joined) {
    fail("Najpierw opusc obecny gang.");
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Gangu nie zalozysz z celi.");
  }
  if (Number(player?.profile?.respect || 0) < 15) {
    fail("Na zalozenie gangu potrzebujesz co najmniej 15 szacunu.");
  }

  const cleanName = String(gangName || "").trim();
  if (cleanName.length < 3) {
    fail("Nazwa gangu jest za krotka.");
  }
  const existingGangNames = Array.isArray(options?.existingGangNames)
    ? options.existingGangNames
        .map((entry) => String(entry || "").trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (existingGangNames.includes(cleanName.toLowerCase())) {
    fail("Taki gang jest juz na miescie.");
  }
  if (Number(player?.profile?.cash || 0) < Number(player.gang.createCost || 0)) {
    fail(`Zalozenie gangu kosztuje ${player.gang.createCost}$.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(player.gang.createCost || 0);
  player.gang = ensureGangWeeklyGoal(
    createGangState({
      joined: true,
      role: "Boss",
      name: cleanName,
      members: 1,
      vault: 4000,
      gearScore: 68,
      membersList: [{ id: "gm-self", name: player.profile?.name || "Gracz", role: "Boss", trusted: true }],
      chat: [
        {
          id: `gang-${now}`,
          author: "System",
          text: `Gang ${cleanName} rusza na miasto.`,
          time: new Date(now).toISOString(),
        },
      ],
    }),
    now
  );

  return {
    gangName: cleanName,
    logMessage: `Zakladasz gang ${cleanName}. Teraz mozesz pchac wplywy i projekty.`,
  };
}

export function joinGangForPlayer(player, invite, now = Date.now(), gangSnapshot = null) {
  ensurePlayerGangState(player, now);
  if (player.gang.joined) {
    fail("Najpierw opusc obecny gang.");
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Do gangu nie dolaczysz z celi.");
  }

  const safeInvite = invite && typeof invite === "object" ? invite : {};
  const gangName = String(safeInvite.gangName || "").trim();
  if (!gangName) {
    fail("Brakuje nazwy gangu.");
  }
  if (gangSnapshot && String(gangSnapshot?.name || "").trim().toLowerCase() !== gangName.toLowerCase()) {
    fail("Zaproszenie nie pasuje do aktywnego gangu.");
  }
  if (Number(player?.profile?.respect || 0) < Number(safeInvite.inviteRespectMin || 15)) {
    fail(`Ten gang bierze od ${safeInvite.inviteRespectMin || 15} szacunu.`);
  }

  const previousInvites = Array.isArray(player.gang?.invites) ? player.gang.invites : [];
  const rosterFromGang = Array.isArray(gangSnapshot?.membersList)
    ? gangSnapshot.membersList
        .filter((member) => member && typeof member.name === "string" && member.name.trim())
        .map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role || "Czlonek",
          trusted: Boolean(member.trusted),
        }))
    : [];
  const selfName = player.profile?.name || "Gracz";
  if (!rosterFromGang.some((member) => member.name === selfName)) {
    rosterFromGang.push({
      id: "gm-self",
      name: selfName,
      role: "Czlonek",
      trusted: false,
    });
  }

  player.gang = ensureGangWeeklyGoal(
    createGangState({
      joined: true,
      role: "Czlonek",
      name: gangName,
      members: Math.max(2, Number(gangSnapshot?.members || safeInvite.members || 1) + 1),
      territory: Math.max(0, Number(gangSnapshot?.territory || safeInvite.territory || 0)),
      influence: Math.max(0, Number(gangSnapshot?.influence || 0)),
      vault: Math.max(0, Number(gangSnapshot?.vault || 3200 + Math.max(0, Number(safeInvite.members || 0)) * 180)),
      gearScore: Math.max(58, Math.floor(Number(gangSnapshot?.members || safeInvite.members || 1) * 4 + 42)),
      inviteRespectMin: Math.max(15, Number(gangSnapshot?.inviteRespectMin || safeInvite.inviteRespectMin || 15)),
      focusDistrictId: gangSnapshot?.focusDistrictId,
      projects:
        gangSnapshot?.projects && typeof gangSnapshot.projects === "object" && !Array.isArray(gangSnapshot.projects)
          ? { ...gangSnapshot.projects }
          : {},
      weeklyGoal:
        gangSnapshot?.weeklyGoal && typeof gangSnapshot.weeklyGoal === "object" && !Array.isArray(gangSnapshot.weeklyGoal)
          ? { ...gangSnapshot.weeklyGoal }
          : undefined,
      weeklyProgress:
        gangSnapshot?.weeklyProgress && typeof gangSnapshot.weeklyProgress === "object" && !Array.isArray(gangSnapshot.weeklyProgress)
          ? { ...gangSnapshot.weeklyProgress }
          : undefined,
      weeklyGoalClaimedAt: gangSnapshot?.weeklyGoalClaimedAt ?? null,
      membersList: rosterFromGang,
      chat: [
        {
          id: `gang-${now}`,
          author: "System",
          text: `${player.profile?.name || "Gracz"} dolacza do ${gangName}.`,
          time: new Date(now).toISOString(),
        },
        ...(Array.isArray(gangSnapshot?.eventLog) ? gangSnapshot.eventLog.slice(0, 8) : []),
      ].slice(0, 20),
      invites: previousInvites.filter((entry) => {
        const inviteId = String(entry?.id || "").trim();
        const inviteGangName = String(entry?.gangName || "").trim().toLowerCase();
        if (inviteId && inviteId === String(safeInvite.id || "").trim()) return false;
        return inviteGangName !== gangName.toLowerCase();
      }),
    }),
    now
  );

  return {
    gangName,
    logMessage: `Dolaczasz do ${gangName}. Otwieraja sie projekty i walka o teren.`,
  };
}

export function leaveGangForPlayer(player, now = Date.now()) {
  ensurePlayerGangState(player, now);
  if (!player.gang.joined) {
    fail("Nie jestes w zadnym gangu.");
  }

  player.gang = createGangState({
    invites: player.gang.invites,
  });

  return {
    logMessage: "Opuszczasz gang i zostajesz solo na miescie.",
  };
}

export function setGangFocusForPlayer(player, districtId, now = Date.now()) {
  ensurePlayerGangState(player, now);
  if (!player.gang.joined) {
    fail("Najpierw wejdz do gangu.");
  }
  const district = findDistrictById(districtId || player.gang.focusDistrictId || DISTRICTS[0].id);
  player.gang.focusDistrictId = district.id;
  player.gang = ensureGangWeeklyGoal(player.gang, now);

  return {
    districtId: district.id,
    districtName: district.name,
    logMessage: `Gang przerzuca fokus na ${district.name}.`,
  };
}

export function contributeGangVaultForPlayer(player, amount, now = Date.now()) {
  ensurePlayerGangState(player, now);
  if (!player.gang.joined) {
    fail("Najpierw wejdz do gangu.");
  }
  const safeAmount = Math.max(1, Math.floor(Number(amount || 0)));
  if (Number(player?.profile?.cash || 0) < safeAmount) {
    fail("Nie masz tyle gotowki przy sobie.");
  }

  player.profile.cash = Number(player.profile.cash || 0) - safeAmount;
  player.gang.vault = Math.max(0, Number(player.gang.vault || 0) + safeAmount);
  player.gang = incrementGangGoalProgress(player.gang, "projectInvestments", 1, now);

  return {
    amount: safeAmount,
    logMessage: `Wrzucasz do skarbca ${safeAmount}$.`,
  };
}

export function investGangProjectForPlayer(player, projectId, now = Date.now()) {
  ensurePlayerGangState(player, now);
  if (!player.gang.joined) {
    fail("Najpierw wejdz do gangu.");
  }
  const project = getGangProjectById(projectId);
  if (!project) {
    fail("Nie ma takiego projektu.");
  }

  const currentLevel = getGangProjectLevel(player.gang, project.id);
  if (currentLevel >= project.levels.length) {
    fail("Ten projekt jest juz wbity na max.");
  }
  const cost = getGangProjectCost(player.gang, project.id);
  if (!Number.isFinite(cost) || cost <= 0) {
    fail("Nie da sie policzyc kosztu projektu.");
  }
  if (Number(player.gang.vault || 0) < cost) {
    fail(`Brakuje ${cost}$ w skarbcu gangu.`);
  }

  player.gang.vault = Math.max(0, Number(player.gang.vault || 0) - cost);
  player.gang.projects = {
    ...(player.gang.projects || {}),
    [project.id]: currentLevel + 1,
  };
  player.gang = incrementGangGoalProgress(player.gang, "projectInvestments", 1, now);
  player.gang.chat = [
    {
      id: `gang-project-${project.id}-${now}`,
      author: "System",
      text: `${project.name} wskakuje na poziom ${currentLevel + 1}.`,
      time: new Date(now).toISOString(),
    },
    ...(player.gang.chat || []),
  ].slice(0, 20);

  return {
    projectId: project.id,
    level: currentLevel + 1,
    cost,
    effects: getGangProjectEffects(player.gang),
    logMessage: `Projekt ${project.name} wskakuje wyzej i zaczyna pracowac dla ekipy.`,
  };
}

export function claimGangWeeklyGoalForPlayer(player, now = Date.now()) {
  ensurePlayerGangState(player, now);
  if (!player.gang.joined) {
    fail("Najpierw wejdz do gangu.");
  }

  const progress = getGangWeeklyProgress(player.gang, now);
  if (progress.claimed) {
    fail("Ten cel tygodnia jest juz odebrany.");
  }
  if (!progress.completed) {
    fail("Cel tygodnia nie jest jeszcze domkniety.");
  }

  player.gang.weeklyGoalClaimedAt = now;
  return {
    rewards: progress.goal.rewards,
    goal: progress.goal,
    logMessage: "Cel tygodnia domkniety. Miasto przez chwile oddycha po Twojej stronie.",
  };
}
