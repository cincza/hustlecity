import { DISTRICTS } from "./districts.js";

const clampGangValue = (value, min, max) =>
  Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));

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

function getWeekKey(now = Date.now()) {
  const date = new Date(now);
  const safeDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = safeDate.getUTCDay() || 7;
  safeDate.setUTCDate(safeDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(safeDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((safeDate - yearStart) / 86400000) + 1) / 7);
  return `${safeDate.getUTCFullYear()}-${weekNo}`;
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

export function createGangState(overrides = {}) {
  return {
    joined: false,
    role: null,
    name: null,
    members: 0,
    maxMembers: 30,
    territory: 0,
    influence: 0,
    vault: 0,
    inviteRespectMin: 15,
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
  const normalizedGangName =
    typeof value.name === "string" && value.name.trim() ? value.name.trim() : null;
  const legacyDemoGang = isLegacyDemoGangName(normalizedGangName);
  const joined = Boolean(value.joined) && !legacyDemoGang;

  return {
    joined,
    role: joined && typeof value.role === "string" && value.role.trim() ? value.role.trim() : null,
    name: joined ? normalizedGangName : null,
    members: joined ? Math.max(0, Math.floor(Number(value.members || 0))) : 0,
    maxMembers: Math.max(1, Math.floor(Number(value.maxMembers || base.maxMembers))),
    territory: joined ? Math.max(0, Math.floor(Number(value.territory || 0))) : 0,
    influence: joined ? Math.max(0, Math.floor(Number(value.influence || 0))) : 0,
    vault: joined ? Math.max(0, Math.floor(Number(value.vault || 0))) : 0,
    inviteRespectMin: clampGangValue(value.inviteRespectMin, 15, 60),
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
  };
}

export function ensureGangWeeklyGoal(gangState, now = Date.now()) {
  const gang = normalizeGangState(gangState);
  const nextGoal = createGangWeeklyGoal(gang.focusDistrictId, now);
  if (gang.weeklyGoal?.weekKey !== nextGoal.weekKey || gang.weeklyGoal?.focusDistrictId !== gang.focusDistrictId) {
    gang.weeklyGoal = nextGoal;
    gang.weeklyProgress = {};
    gang.weeklyGoalClaimedAt = null;
  }
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
      Object.entries(entry.effect || {}).forEach(([key, value]) => {
        totals[key] = Number((Number(totals[key] || 0) + Number(value || 0)).toFixed(3));
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
