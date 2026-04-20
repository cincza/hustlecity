import { DISTRICTS } from "./districts.js";

const clampGangValue = (value, min, max) =>
  Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));

export const GANG_INVITE_RESPECT_MIN = 5;
export const GANG_INVITE_RESPECT_MAX = 200;
export const clampGangInviteRespectMin = (value) =>
  clampGangValue(value, GANG_INVITE_RESPECT_MIN, GANG_INVITE_RESPECT_MAX);

export const GANG_MEMBER_MANAGEABLE_ROLES = ["Czlonek", "Zaufany", "Vice Boss"];
export const normalizeGangManageableRole = (value, fallback = "Czlonek") => {
  const role = String(value || "").trim();
  return GANG_MEMBER_MANAGEABLE_ROLES.includes(role) ? role : fallback;
};
export const isGangManageableRole = (value) =>
  GANG_MEMBER_MANAGEABLE_ROLES.includes(String(value || "").trim());

export const GANG_MEMBER_CAP_STEPS = [8, 12, 16, 20, 25];
export const GANG_MEMBER_CAP_UPGRADES = [
  { level: 1, maxMembers: 12, cost: 18000 },
  { level: 2, maxMembers: 16, cost: 42000 },
  { level: 3, maxMembers: 20, cost: 82000 },
  { level: 4, maxMembers: 25, cost: 140000 },
];

export const DEMO_GANG_INVITES = [];
const LEGACY_DEMO_GANG_INVITE_IDS = new Set(["inv-1", "inv-2"]);
const LEGACY_DEMO_GANG_NAMES = new Set(["grey saints", "cold avenue", "night vultures", "velvet ash"]);

export function isLegacyDemoGangName(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? LEGACY_DEMO_GANG_NAMES.has(normalized) : false;
}

export const GANG_PROJECTS = [
  {
    id: "club-security",
    name: "Ochrona lokalu",
    summary: "Lepsze drzwi, obserwacja i szybsza reakcja na zagrozenie.",
    levels: [
      { cost: 6000, effect: { clubSecurity: 1, clubThreatMitigation: 0.05 } },
      { cost: 14000, effect: { clubSecurity: 1, clubThreatMitigation: 0.07 } },
      { cost: 26000, effect: { clubSecurity: 1, clubThreatMitigation: 0.09 } },
    ],
  },
  {
    id: "informants",
    name: "Siec informatorow",
    summary: "Czujesz przecieki szybciej i wolniej rozniesie sie cisnienie.",
    levels: [
      { cost: 7000, effect: { pressureMitigation: 0.05, operationLeakReduction: 0.04 } },
      { cost: 15500, effect: { pressureMitigation: 0.07, operationLeakReduction: 0.05 } },
      { cost: 28500, effect: { pressureMitigation: 0.09, operationLeakReduction: 0.06 } },
    ],
  },
  {
    id: "escape-fleet",
    name: "Flota ucieczkowa",
    summary: "Lepszy odjazd po robocie i mniejsze straty przy spalonej akcji.",
    levels: [
      { cost: 8500, effect: { operationSuccess: 0.03, operationRetention: 0.04 } },
      { cost: 17500, effect: { operationSuccess: 0.04, operationRetention: 0.05 } },
      { cost: 32000, effect: { operationSuccess: 0.05, operationRetention: 0.06 } },
    ],
  },
  {
    id: "safehouse",
    name: "Safehouse",
    summary: "Masz gdzie przeczekac, ogarnac ekipe i zebrac oddech po wtapie.",
    levels: [
      { cost: 9000, effect: { heatRelief: 1, hpRelief: 2 } },
      { cost: 18000, effect: { heatRelief: 1, hpRelief: 3 } },
      { cost: 34000, effect: { heatRelief: 2, hpRelief: 4 } },
    ],
  },
  {
    id: "district-push",
    name: "Wplywy dzielnicowe",
    summary: "Ludzie na miejscu trzymaja grunt i podbijaja puls w fokusu.",
    levels: [
      { cost: 7500, effect: { influenceGain: 0.08 } },
      { cost: 16500, effect: { influenceGain: 0.1 } },
      { cost: 30000, effect: { influenceGain: 0.12 } },
    ],
  },
];

export const GANG_WEEKLY_GOAL_TEMPLATES = [
  {
    id: "focus-heists",
    title: "Rozgrzej fokus",
    summary: "Wbij cztery akcje w fokusie i pokaz, ze teren zyje.",
    progressKey: "focusHeists",
    target: 4,
    rewards: { vaultCash: 5000, focusInfluence: 8, pressureRelief: 6 },
  },
  {
    id: "night-shift",
    title: "Pilnuj nocy",
    summary: "Zrob cztery ruchy wokol klubu i trzymaj obrot.",
    progressKey: "clubActions",
    target: 4,
    rewards: { vaultCash: 4500, focusInfluence: 6, pressureRelief: 8 },
  },
  {
    id: "big-job",
    title: "Grubsza robota",
    summary: "Domknij jedna wieloetapowa operacje.",
    progressKey: "operations",
    target: 1,
    rewards: { vaultCash: 6500, focusInfluence: 10, pressureRelief: 5 },
  },
];

export const GANG_JOB_BOARD_TEMPLATES = [
  {
    id: "open-heist",
    title: "Zbierz ekipe",
    summary: "Otworz jedno lobby napadu i zbij sklad.",
    progressKey: "gangHeistsOpened",
    target: 1,
    rewards: { vaultCash: 1200, focusInfluence: 2 },
  },
  {
    id: "finish-heist",
    title: "Domknij robote",
    summary: "Dociagnij jeden napad gangu do konca.",
    progressKey: "gangHeistsCompleted",
    target: 1,
    rewards: { vaultCash: 2200, focusInfluence: 4, pressureRelief: 2 },
  },
  {
    id: "vault-run",
    title: "Napompuj skarbiec",
    summary: "Dorzuccie razem 15000$ do skarbca gangu.",
    progressKey: "vaultContributed",
    target: 15000,
    rewards: { vaultCash: 2600, focusInfluence: 2 },
  },
  {
    id: "district-pulse",
    title: "Puls dzielnicy",
    summary: "Podbijcie wspolnie 10 pkt ruchu we fokusie.",
    progressKey: "districtInfluencePulse",
    target: 10,
    rewards: { vaultCash: 1800, focusInfluence: 5, pressureRelief: 3 },
  },
  {
    id: "club-guard",
    title: "Pilnuj lokalu",
    summary: "Utrzymaj chroniony klub w spokojnym raporcie.",
    progressKey: "protectedClubStableReports",
    target: 1,
    rewards: { vaultCash: 2000, focusInfluence: 3, pressureRelief: 4 },
  },
];

function getWeekKey(now = Date.now()) {
  const date = new Date(now);
  const safeDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = safeDate.getUTCDay() || 7;
  safeDate.setUTCDate(safeDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(safeDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((safeDate - yearStart) / 86400000) + 1) / 7);
  return `${safeDate.getUTCFullYear()}-${weekNo}`;
}

function normalizeTimestampMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => Boolean(String(key || "").trim()))
      .map(([key, entry]) => [key, Number.isFinite(Number(entry)) ? Number(entry) : 0])
      .filter(([, entry]) => entry > 0)
  );
}

function clampGangMemberCapLevel(value) {
  return clampGangValue(value, 0, GANG_MEMBER_CAP_UPGRADES.length);
}

function deriveGangMemberCapLevel(rawLevel, rawMaxMembers) {
  if (Number.isFinite(Number(rawLevel))) {
    return clampGangMemberCapLevel(rawLevel);
  }
  const maxMembers = Math.max(1, Math.floor(Number(rawMaxMembers || GANG_MEMBER_CAP_STEPS[0])));
  let matchedLevel = 0;
  GANG_MEMBER_CAP_STEPS.forEach((step, index) => {
    if (maxMembers >= step) {
      matchedLevel = index;
    }
  });
  return clampGangMemberCapLevel(matchedLevel);
}

export function getGangMemberCapForLevel(level = 0) {
  return GANG_MEMBER_CAP_STEPS[clampGangMemberCapLevel(level)] || GANG_MEMBER_CAP_STEPS[0];
}

export function getGangMemberCapUpgrade(level = 0) {
  const safeLevel = clampGangMemberCapLevel(level);
  return GANG_MEMBER_CAP_UPGRADES.find((entry) => entry.level === safeLevel + 1) || null;
}

function normalizeGangHeistLobby(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const participantIds = Array.isArray(value.participantIds)
    ? value.participantIds.map((entry) => String(entry || "").trim()).filter(Boolean).slice(0, 25)
    : [];
  if (!String(value.heistId || "").trim()) return null;
  return {
    id: String(value.id || `gang-heist-${value.heistId}`).trim(),
    heistId: String(value.heistId || "").trim(),
    status: String(value.status || "open").trim() || "open",
    note: typeof value.note === "string" ? value.note.trim().slice(0, 140) : "",
    openedByUserId: String(value.openedByUserId || "").trim() || null,
    openedByName: typeof value.openedByName === "string" ? value.openedByName.trim() : "Ekipa",
    participantIds,
    requiredMembers: Math.max(1, Math.floor(Number(value.requiredMembers || participantIds.length || 1))),
    createdAt: Number.isFinite(Number(value.createdAt)) ? Number(value.createdAt) : 0,
    startedAt: Number.isFinite(Number(value.startedAt)) ? Number(value.startedAt) : null,
    chance: Number.isFinite(Number(value.chance)) ? Number(value.chance) : null,
    squadPower: Number.isFinite(Number(value.squadPower)) ? Number(value.squadPower) : null,
    summary:
      value.summary && typeof value.summary === "object" && !Array.isArray(value.summary)
        ? {
            memberCount: Math.max(0, Math.floor(Number(value.summary.memberCount || participantIds.length))),
            requiredMembers: Math.max(1, Math.floor(Number(value.summary.requiredMembers || value.requiredMembers || 1))),
            totalPower: Math.max(0, Math.round(Number(value.summary.totalPower || 0))),
            avgPower: Math.max(0, Math.round(Number(value.summary.avgPower || 0))),
            recommendedRespect: Math.max(0, Math.floor(Number(value.summary.recommendedRespect || 0))),
            chance: Number.isFinite(Number(value.summary.chance)) ? Number(value.summary.chance) : 0,
            ready: Boolean(value.summary.ready),
          }
        : null,
  };
}

function normalizeGangHeistReport(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    id: String(value.id || value.heistId || "").trim() || null,
    heistId: String(value.heistId || "").trim() || null,
    heistName: typeof value.heistName === "string" ? value.heistName.trim() : "Napad gangu",
    success: Boolean(value.success),
    districtId: String(value.districtId || "").trim() || null,
    createdAt: Number.isFinite(Number(value.createdAt)) ? Number(value.createdAt) : 0,
    vaultCut: Math.max(0, Math.floor(Number(value.vaultCut || 0))),
    totalTake: Math.max(0, Math.floor(Number(value.totalTake || 0))),
    teamChance: Number.isFinite(Number(value.teamChance)) ? Number(value.teamChance) : null,
    incident: typeof value.incident === "string" ? value.incident.trim() : "",
    jailedParticipantIds: Array.isArray(value.jailedParticipantIds)
      ? value.jailedParticipantIds.map((entry) => String(entry || "").trim()).filter(Boolean).slice(0, 25)
      : [],
    rescueResolvedAt: Number.isFinite(Number(value.rescueResolvedAt)) ? Number(value.rescueResolvedAt) : null,
    rescueAttemptedAt: Number.isFinite(Number(value.rescueAttemptedAt)) ? Number(value.rescueAttemptedAt) : null,
    rescueMode: typeof value.rescueMode === "string" ? value.rescueMode.trim() : null,
    rescueSuccess: typeof value.rescueSuccess === "boolean" ? value.rescueSuccess : null,
    participants: Array.isArray(value.participants)
      ? value.participants
          .map((entry) => ({
            userId: String(entry?.userId || "").trim() || null,
            name: typeof entry?.name === "string" ? entry.name.trim() : "Gracz",
            cash: Math.max(0, Math.floor(Number(entry?.cash || 0))),
            xp: Math.max(0, Math.floor(Number(entry?.xp || 0))),
            jailed: Boolean(entry?.jailed),
            heat: Math.max(0, Math.floor(Number(entry?.heat || 0))),
            hpLoss: Math.max(0, Math.floor(Number(entry?.hpLoss || 0))),
          }))
          .slice(0, 25)
      : [],
  };
}

function normalizeProtectedClub(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = String(value.id || value.venueId || "").trim();
  if (!id) return null;
  return {
    id,
    name: typeof value.name === "string" ? value.name.trim() : "Klub",
    districtId: String(value.districtId || "").trim() || DISTRICTS[0].id,
    threat: Math.max(0, Math.floor(Number(value.threat || 0))),
    stability: Math.max(0, Math.floor(Number(value.stability || 0))),
    influenceBonus: Number.isFinite(Number(value.influenceBonus)) ? Number(value.influenceBonus) : 0,
  };
}

export function getGangProjectById(projectId) {
  return GANG_PROJECTS.find((project) => project.id === projectId) || null;
}

export function createGangWeeklyGoal(focusDistrictId = DISTRICTS[0].id, now = Date.now()) {
  const weekKey = getWeekKey(now);
  const focusDistrict = DISTRICTS.find((district) => district.id === focusDistrictId) || DISTRICTS[0];
  const templateIndex =
    Math.abs(
      weekKey
        .split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0)
    ) % GANG_WEEKLY_GOAL_TEMPLATES.length;
  const template = GANG_WEEKLY_GOAL_TEMPLATES[templateIndex];

  return {
    ...template,
    weekKey,
    focusDistrictId: focusDistrict.id,
    title: `${template.title}: ${focusDistrict.name}`,
  };
}

export function createGangJobBoard(
  focusDistrictId = DISTRICTS[0].id,
  now = Date.now(),
  options = {}
) {
  const weekKey = getWeekKey(now);
  const focusDistrict = DISTRICTS.find((district) => district.id === focusDistrictId) || DISTRICTS[0];
  const wantsProtectedClub = Boolean(options.protectedClubId);
  const templateIds = wantsProtectedClub
    ? ["open-heist", "finish-heist", "club-guard", "district-pulse"]
    : ["open-heist", "finish-heist", "vault-run", "district-pulse"];

  return templateIds
    .map((templateId) => GANG_JOB_BOARD_TEMPLATES.find((entry) => entry.id === templateId))
    .filter(Boolean)
    .map((template) => ({
      ...template,
      weekKey,
      focusDistrictId: focusDistrict.id,
      title: template.id === "district-pulse" ? `${template.title}: ${focusDistrict.name}` : template.title,
    }));
}

export function createGangState(overrides = {}) {
  const memberCapLevel = deriveGangMemberCapLevel(overrides.memberCapLevel, overrides.maxMembers);
  const maxMembers = getGangMemberCapForLevel(memberCapLevel);
  return {
    joined: false,
    role: null,
    name: null,
    members: 0,
    memberCapLevel,
    maxMembers,
    territory: 0,
    influence: 0,
    vault: 0,
    inviteRespectMin: GANG_INVITE_RESPECT_MIN,
    createCost: 250000,
    chat: [],
    lastTributeAt: 0,
    gearScore: 62,
    jailedCrew: 0,
    crewLockdownUntil: 0,
    membersList: [],
    invites: DEMO_GANG_INVITES.map((invite) => ({ ...invite })),
    focusDistrictId: DISTRICTS[0].id,
    projects: {},
    weeklyGoal: createGangWeeklyGoal(DISTRICTS[0].id),
    weeklyProgress: {},
    weeklyGoalClaimedAt: null,
    jobBoard: createGangJobBoard(DISTRICTS[0].id),
    jobProgress: {},
    jobRewardedAt: {},
    activeHeistLobby: null,
    lastHeistReport: null,
    protectedClub: null,
    ...overrides,
  };
}

export function normalizeGangState(value) {
  const base = createGangState();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const focusDistrict =
    DISTRICTS.find((district) => district.id === value.focusDistrictId) || DISTRICTS[0];
  const weeklyGoal =
    value.weeklyGoal && typeof value.weeklyGoal === "object" && !Array.isArray(value.weeklyGoal)
      ? {
          ...createGangWeeklyGoal(focusDistrict.id),
          ...value.weeklyGoal,
          focusDistrictId:
            DISTRICTS.find((district) => district.id === value.weeklyGoal.focusDistrictId)?.id ||
            focusDistrict.id,
        }
      : createGangWeeklyGoal(focusDistrict.id);
  const protectedClub = normalizeProtectedClub(value.protectedClub);
  const jobBoardBase = createGangJobBoard(focusDistrict.id, Date.now(), {
    protectedClubId: protectedClub?.id,
  });
  const normalizedGangName =
    typeof value.name === "string" && value.name.trim() ? value.name.trim() : null;
  const legacyDemoGang = isLegacyDemoGangName(normalizedGangName);
  const joined = Boolean(value.joined) && !legacyDemoGang;
  const memberCapLevel = deriveGangMemberCapLevel(value.memberCapLevel, value.maxMembers);
  const maxMembers = getGangMemberCapForLevel(memberCapLevel);

  return {
    joined,
    role: joined && typeof value.role === "string" && value.role.trim() ? value.role.trim() : null,
    name: joined ? normalizedGangName : null,
    members: joined ? Math.max(0, Math.floor(Number(value.members || 0))) : 0,
    memberCapLevel,
    maxMembers,
    territory: joined ? Math.max(0, Math.floor(Number(value.territory || 0))) : 0,
    influence: joined ? Math.max(0, Math.floor(Number(value.influence || 0))) : 0,
    vault: joined ? Math.max(0, Math.floor(Number(value.vault || 0))) : 0,
    inviteRespectMin: clampGangInviteRespectMin(value.inviteRespectMin),
    createCost: Math.max(0, Math.floor(Number(value.createCost || base.createCost))),
    chat: joined && Array.isArray(value.chat) ? value.chat.slice(0, 20) : [],
    lastTributeAt: Math.max(0, Math.floor(Number(value.lastTributeAt || 0))),
    gearScore: joined ? Math.max(0, Math.floor(Number(value.gearScore || base.gearScore))) : base.gearScore,
    jailedCrew: joined ? Math.max(0, Math.floor(Number(value.jailedCrew || 0))) : 0,
    crewLockdownUntil: joined ? Math.max(0, Math.floor(Number(value.crewLockdownUntil || 0))) : 0,
    membersList: joined && Array.isArray(value.membersList) ? value.membersList.slice(0, 32) : [],
    invites: Array.isArray(value.invites)
      ? value.invites.filter((invite) => {
          if (!invite || typeof invite.id !== "string") return false;
          const inviteId = String(invite.id || "").trim();
          const gangName = String(invite.gangName || "").trim().toLowerCase();
          if (!inviteId) return false;
          if (LEGACY_DEMO_GANG_INVITE_IDS.has(inviteId)) return false;
          if (gangName && LEGACY_DEMO_GANG_NAMES.has(gangName)) return false;
          return true;
        })
      : base.invites,
    focusDistrictId: focusDistrict.id,
    projects:
      value.projects && typeof value.projects === "object" && !Array.isArray(value.projects)
        ? Object.fromEntries(
            GANG_PROJECTS.map((project) => [
              project.id,
              Math.max(0, Math.floor(Number(value.projects?.[project.id] || 0))),
            ]).filter(([, level]) => level > 0)
          )
        : {},
    weeklyGoal,
    weeklyProgress:
      value.weeklyProgress && typeof value.weeklyProgress === "object" && !Array.isArray(value.weeklyProgress)
        ? { ...value.weeklyProgress }
        : {},
    weeklyGoalClaimedAt: Number.isFinite(value.weeklyGoalClaimedAt) ? value.weeklyGoalClaimedAt : null,
    jobBoard:
      Array.isArray(value.jobBoard) && value.jobBoard.length
        ? value.jobBoard
            .map((entry) => {
              const template = GANG_JOB_BOARD_TEMPLATES.find((job) => job.id === entry?.id);
              if (!template) return null;
              return {
                ...template,
                ...entry,
                focusDistrictId:
                  DISTRICTS.find((district) => district.id === entry?.focusDistrictId)?.id || focusDistrict.id,
              };
            })
            .filter(Boolean)
            .slice(0, 4)
        : jobBoardBase,
    jobProgress:
      value.jobProgress && typeof value.jobProgress === "object" && !Array.isArray(value.jobProgress)
        ? { ...value.jobProgress }
        : {},
    jobRewardedAt: normalizeTimestampMap(value.jobRewardedAt),
    activeHeistLobby: normalizeGangHeistLobby(value.activeHeistLobby),
    lastHeistReport: normalizeGangHeistReport(value.lastHeistReport),
    protectedClub,
  };
}

export function ensureGangWeeklyGoal(gangState, now = Date.now()) {
  const gang = normalizeGangState(gangState);
  const nextGoal = createGangWeeklyGoal(gang.focusDistrictId, now);
  const nextBoard = createGangJobBoard(gang.focusDistrictId, now, {
    protectedClubId: gang.protectedClub?.id,
  });
  const currentWeekKey = gang.weeklyGoal?.weekKey;
  const currentBoardWeekKey = gang.jobBoard?.[0]?.weekKey || null;
  if (currentWeekKey !== nextGoal.weekKey || gang.weeklyGoal?.focusDistrictId !== gang.focusDistrictId) {
    gang.weeklyGoal = nextGoal;
    gang.weeklyProgress = {};
    gang.weeklyGoalClaimedAt = null;
  }
  if (currentBoardWeekKey !== nextGoal.weekKey || gang.jobBoard?.[0]?.focusDistrictId !== gang.focusDistrictId) {
    gang.jobBoard = nextBoard;
    gang.jobProgress = {};
    gang.jobRewardedAt = {};
  }
  return gang;
}

export function syncGangProtectedClub(gangState, protectedClub) {
  const gang = normalizeGangState(gangState);
  gang.protectedClub = normalizeProtectedClub(protectedClub);
  gang.jobBoard = createGangJobBoard(gang.focusDistrictId, Date.now(), {
    protectedClubId: gang.protectedClub?.id,
  });
  gang.jobProgress = { ...(gang.jobProgress || {}) };
  gang.jobRewardedAt = normalizeTimestampMap(gang.jobRewardedAt);
  return gang;
}

export function getGangProjectLevel(gangState, projectId) {
  const gang = normalizeGangState(gangState);
  return Math.max(0, Math.floor(Number(gang.projects?.[projectId] || 0)));
}

export function getGangProjectCost(gangState, projectId) {
  const project = getGangProjectById(projectId);
  if (!project) return null;
  const currentLevel = getGangProjectLevel(gangState, projectId);
  return project.levels[currentLevel]?.cost || null;
}

export function getGangProjectEffects(gangState) {
  const gang = normalizeGangState(gangState);
  const totals = {
    clubSecurity: 0,
    clubThreatMitigation: 0,
    pressureMitigation: 0,
    operationLeakReduction: 0,
    operationSuccess: 0,
    operationRetention: 0,
    heatRelief: 0,
    hpRelief: 0,
    influenceGain: 0,
  };

  for (const project of GANG_PROJECTS) {
    const level = getGangProjectLevel(gang, project.id);
    project.levels.slice(0, level).forEach((entry) => {
      Object.entries(entry.effect || {}).forEach(([key, amount]) => {
        totals[key] = Number((Number(totals[key] || 0) + Number(amount || 0)).toFixed(3));
      });
    });
  }

  return totals;
}

export function incrementGangGoalProgress(gangState, type, amount = 1, now = Date.now()) {
  const gang = ensureGangWeeklyGoal(gangState, now);
  const safeAmount = Math.max(0, Number(amount || 0));
  if (!safeAmount) return gang;

  gang.weeklyProgress = {
    ...(gang.weeklyProgress || {}),
    [type]: Math.max(0, Number(gang.weeklyProgress?.[type] || 0) + safeAmount),
  };
  return gang;
}

export function getGangWeeklyProgress(gangState, now = Date.now()) {
  const gang = ensureGangWeeklyGoal(gangState, now);
  const goal = gang.weeklyGoal;
  const current = Math.max(0, Number(gang.weeklyProgress?.[goal.progressKey] || 0));
  return {
    goal,
    current,
    target: Number(goal.target || 0),
    completed: current >= Number(goal.target || 0),
    claimed: Boolean(gang.weeklyGoalClaimedAt),
  };
}

export function recordGangJobProgress(gangState, progressKey, amount = 1, now = Date.now()) {
  const gang = ensureGangWeeklyGoal(gangState, now);
  const safeAmount = Math.max(0, Number(amount || 0));
  if (!safeAmount) {
    return { gang, completedJobs: [] };
  }

  gang.jobProgress = {
    ...(gang.jobProgress || {}),
    [progressKey]: Math.max(0, Number(gang.jobProgress?.[progressKey] || 0) + safeAmount),
  };

  const completedJobs = [];
  (gang.jobBoard || []).forEach((job) => {
    if (job.progressKey !== progressKey) return;
    const current = Math.max(0, Number(gang.jobProgress?.[progressKey] || 0));
    if (current < Number(job.target || 0)) return;
    if (Number(gang.jobRewardedAt?.[job.id] || 0) > 0) return;
    gang.jobRewardedAt = {
      ...(gang.jobRewardedAt || {}),
      [job.id]: now,
    };
    completedJobs.push({
      ...job,
      current,
    });
  });

  return { gang, completedJobs };
}

export function getGangJobBoardProgress(gangState, now = Date.now()) {
  const gang = ensureGangWeeklyGoal(gangState, now);
  return (gang.jobBoard || []).map((job) => {
    const current = Math.max(0, Number(gang.jobProgress?.[job.progressKey] || 0));
    return {
      ...job,
      current,
      completed: current >= Number(job.target || 0),
      rewarded: Number(gang.jobRewardedAt?.[job.id] || 0) > 0,
    };
  });
}
