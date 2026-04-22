import { getDistrictSummaries } from "./districts.js";

export const TASK_DEFINITIONS = [
  {
    id: "pierwszy-skok",
    tier: 1,
    title: "Pierwszy skok",
    description: "Zrob 3 skoki.",
    objective: { kind: "heists_done", target: 3 },
    reward: { cash: 1500, xp: 6 },
  },
  {
    id: "nie-chodz-glodny",
    tier: 1,
    title: "Nie chodz glodny",
    description: "Kup albo zjedz 2 posilki.",
    objective: { kind: "meals_eaten", target: 2 },
    reward: { cash: 800, energy: 15 },
  },
  {
    id: "wroc-do-pionu",
    tier: 1,
    title: "Wroc do pionu",
    description: "Ulecz sie 1 raz.",
    objective: { kind: "heals_used", target: 1 },
    reward: { cash: 800, hp: 20 },
  },
  {
    id: "pierwszy-trening",
    tier: 1,
    title: "Pierwszy trening",
    description: "Zrob 3 treningi na silowni.",
    objective: { kind: "gym_trainings", target: 3 },
    reward: { cash: 1200, xp: 6 },
  },
  {
    id: "schowaj-hajs",
    tier: 1,
    title: "Schowaj hajs",
    description: "Wplac do banku 3000.",
    objective: { kind: "bank_deposit_total", target: 3000 },
    reward: { cash: 1500, xp: 5 },
  },
  {
    id: "maly-obrot",
    tier: 1,
    title: "Maly obrot",
    description: "Kup i sprzedaj 3 zwykle towary.",
    objective: { kind: "market_trade_pair_count", target: 3 },
    reward: { cash: 1800, xp: 6 },
  },
  {
    id: "piec-wejsc",
    tier: 1,
    title: "Piec wejsc",
    description: "Wygraj 5 skokow.",
    objective: { kind: "heists_won", target: 5 },
    reward: { cash: 2200, xp: 7 },
  },
  {
    id: "pierwszy-prog",
    tier: 1,
    title: "Pierwszy prog",
    description: "Wbij 6 respect.",
    objective: { kind: "respect_reached", target: 6 },
    reward: { cash: 2500, xp: 8 },
  },
  {
    id: "pierwsze-dragi",
    tier: 2,
    title: "Pierwsze dragi",
    description: "Kup pierwsze dragi.",
    objective: { kind: "drugs_bought", target: 1 },
    reward: { cash: 2500, xp: 6 },
  },
  {
    id: "reka-dilera",
    tier: 2,
    title: "Reka dilera",
    description: "Sprzedaj dilerowi dragi za 7000.",
    objective: { kind: "dealer_sales_value", target: 7000 },
    reward: { cash: 3500, xp: 7 },
  },
  {
    id: "pierwszy-biznes",
    tier: 2,
    title: "Pierwszy biznes",
    description: "Kup 1 biznes.",
    objective: { kind: "businesses_owned", target: 1 },
    reward: { cash: 5000, xp: 8 },
  },
  {
    id: "odbierz-haracz",
    tier: 2,
    title: "Odbierz haracz",
    description: "Odbierz dochod z biznesu 3 razy.",
    objective: { kind: "business_collections", target: 3 },
    reward: { cash: 3500, xp: 7 },
  },
  {
    id: "dwa-zrodla-kasy",
    tier: 2,
    title: "Dwa zrodla kasy",
    description: "Miej 2 biznesy.",
    objective: { kind: "businesses_owned", target: 2 },
    reward: { cash: 7000, xp: 9 },
  },
  {
    id: "pierwsza-fabryka",
    tier: 2,
    title: "Pierwsza fabryka",
    description: "Kup 1 fabryke.",
    objective: { kind: "factories_owned", target: 1 },
    reward: { cash: 9000, xp: 10 },
  },
  {
    id: "wlasny-towar",
    tier: 2,
    title: "Wlasny towar",
    description: "Wyprodukuj 1 batch narkotykow.",
    objective: { kind: "drug_batches", target: 1 },
    reward: { cash: 5000, xp: 8 },
  },
  {
    id: "brudny-obrot",
    tier: 2,
    title: "Brudny obrot",
    description: "Sprzedaj wlasne dragi za 20000.",
    objective: { kind: "produced_drug_sales_value", target: 20000 },
    reward: { cash: 9000, xp: 10 },
  },
  {
    id: "pieniadz-robi-ruch",
    tier: 2,
    title: "Pieniadz robi ruch",
    description: "Zgromadz 50000 w gotowce albo banku.",
    objective: { kind: "wealth_total", target: 50000 },
    reward: { cash: 7000, xp: 10 },
  },
  {
    id: "klub-na-zapleczu",
    tier: 3,
    title: "Klub na zapleczu",
    description: "Zaloz albo przejmij klub.",
    objective: { kind: "club_owned", target: 1 },
    reward: { cash: 12000, xp: 12 },
  },
  {
    id: "towar-dla-lokalu",
    tier: 3,
    title: "Towar dla lokalu",
    description: "Wrzuc dragi do stashu klubu 1 raz.",
    objective: { kind: "club_stash_moves", target: 1 },
    reward: { cash: 6000, xp: 10 },
  },
  {
    id: "ekipa-albo-samotnie",
    tier: 3,
    title: "Ekipa albo samotnie",
    description: "Dolacz do gangu albo zaloz wlasny.",
    objective: { kind: "gang_joined", target: 1 },
    reward: { cash: 8000, xp: 10 },
  },
  {
    id: "skarbiec-ekipy",
    tier: 3,
    title: "Skarbiec ekipy",
    description: "Wplac do skarbca gangu 15000.",
    objective: { kind: "gang_vault_contributed", target: 15000 },
    reward: { cash: 7000, xp: 10 },
  },
  {
    id: "robota-z-ludzmi",
    tier: 3,
    title: "Robota z ludzmi",
    description: "Wez udzial w 1 napadzie gangu.",
    objective: { kind: "gang_heists_participated", target: 1 },
    reward: { cash: 15000, xp: 12 },
  },
  {
    id: "dzielnica-ma-pamietac",
    tier: 3,
    title: "Dzielnica ma pamietac",
    description: "Zrob 3 akcje w tej samej dzielnicy albo podbij tam influence.",
    objective: { kind: "district_presence", targetActions: 3, influenceTarget: 20 },
    reward: { cash: 12000, xp: 12 },
  },
  {
    id: "pierwszy-kontrakt",
    tier: 3,
    title: "Pierwszy kontrakt",
    description: "Kup asset, wrzuc loadout i dowiez 1 kontrakt.",
    objective: { kind: "first_contract", target: 3 },
    reward: { cash: 20000, xp: 14 },
  },
  {
    id: "operacja-na-serio",
    tier: 3,
    title: "Operacja na serio",
    description: "Ukoncz 1 operacje.",
    objective: { kind: "operations_completed", target: 1 },
    reward: { cash: 30000, xp: 16 },
  },
];

const LEGACY_TASK_DEFINITIONS = [
  {
    id: "gym-pass",
    legacy: true,
    hiddenFromBoard: true,
    title: "Wejdz na silownie",
    description: "Kup dowolny karnet na silownie.",
    objective: { kind: "gym_pass", target: 1 },
    reward: { cash: 500, xp: 6 },
  },
  {
    id: "first-wave",
    legacy: true,
    hiddenFromBoard: true,
    title: "Pierwsza fala napadow",
    description: "Wykonaj 3 napady.",
    objective: { kind: "heists_done", target: 3 },
    reward: { cash: 900, xp: 7 },
  },
  {
    id: "crew",
    legacy: true,
    hiddenFromBoard: true,
    title: "Rozbuduj ekipe",
    description: "Miej przynajmniej 6 ludzi w gangu.",
    objective: { kind: "gang_members", target: 6 },
    reward: { cash: 1300, xp: 9 },
    onlineSupported: false,
    onlineDisabledReason: "Ta misja wroci, gdy gang bedzie w pelni liczony serwerowo.",
  },
  {
    id: "lab",
    legacy: true,
    hiddenFromBoard: true,
    title: "Odpal pierwsza partie",
    description: "Wyprodukuj 2 partie dragow.",
    objective: { kind: "drug_batches", target: 2 },
    reward: { cash: 2000, xp: 10 },
  },
  {
    id: "club",
    legacy: true,
    hiddenFromBoard: true,
    title: "Otworz klub",
    description: "Przejmij lub otworz swoj klub.",
    objective: { kind: "club_owned", target: 1 },
    reward: { cash: 3000, xp: 12 },
  },
];

export const TASK_BOARD_SLOT_COUNT = 6;

function asNumber(value) {
  return Math.max(0, Number(value || 0));
}

function getOwnedBusinessCount(snapshot) {
  return Array.isArray(snapshot?.businessesOwned)
    ? snapshot.businessesOwned.reduce((sum, entry) => sum + Math.max(0, Number(entry?.count || 0)), 0)
    : 0;
}

function getOwnedFactoryCount(snapshot) {
  const factories = snapshot?.factoriesOwned;
  if (!factories || typeof factories !== "object" || Array.isArray(factories)) {
    return 0;
  }
  return Object.values(factories).reduce(
    (sum, amount) => sum + (Number(amount || 0) > 0 ? 1 : 0),
    0
  );
}

function getDistrictPresenceProgress(snapshot, objective) {
  const districtSummaries = getDistrictSummaries(snapshot?.city);
  const bestInfluence = districtSummaries.reduce(
    (best, district) => Math.max(best, asNumber(district?.influence)),
    0
  );
  const actionMap =
    snapshot?.stats?.districtActionsById &&
    typeof snapshot.stats.districtActionsById === "object" &&
    !Array.isArray(snapshot.stats.districtActionsById)
      ? snapshot.stats.districtActionsById
      : {};
  const bestActionCount = Object.values(actionMap).reduce(
    (best, count) => Math.max(best, Math.max(0, Math.floor(Number(count || 0)))),
    0
  );
  const actionTarget = Math.max(1, Number(objective?.targetActions || 3));
  const influenceTarget = Math.max(1, Number(objective?.influenceTarget || 20));
  const influenceAsActions = Math.floor((bestInfluence / influenceTarget) * actionTarget);
  const current = Math.min(actionTarget, Math.max(bestActionCount, influenceAsActions));
  const completed = bestActionCount >= actionTarget || bestInfluence >= influenceTarget;

  return {
    current,
    target: actionTarget,
    label: `Akcje ${bestActionCount}/${actionTarget} | Wplyw ${Math.floor(bestInfluence)}/${influenceTarget}`,
    completed,
  };
}

function getFirstContractProgress(snapshot) {
  const contractState = snapshot?.contracts || {};
  const ownedItemCount =
    contractState?.ownedItems && typeof contractState.ownedItems === "object"
      ? Object.values(contractState.ownedItems).reduce((sum, value) => sum + (Number(value || 0) > 0 ? 1 : 0), 0)
      : 0;
  const ownedCarCount =
    contractState?.ownedCars && typeof contractState.ownedCars === "object"
      ? Object.values(contractState.ownedCars).reduce((sum, value) => sum + (Number(value || 0) > 0 ? 1 : 0), 0)
      : 0;
  const loadoutCount =
    contractState?.loadout && typeof contractState.loadout === "object"
      ? Object.values(contractState.loadout).filter(Boolean).length
      : 0;
  const completedContracts = Math.max(
    asNumber(snapshot?.stats?.contractsCompleted),
    Array.isArray(contractState?.history)
      ? contractState.history.filter((entry) => entry?.success).length
      : 0
  );

  const hasAsset = ownedItemCount + ownedCarCount > 0 || asNumber(snapshot?.stats?.contractAssetsBought) > 0;
  const hasLoadout = loadoutCount > 0 || asNumber(snapshot?.stats?.contractLoadoutEquips) > 0;
  const hasCompletedContract = completedContracts > 0;
  const current = Number(hasAsset) + Number(hasLoadout) + Number(hasCompletedContract);

  return {
    current,
    target: 3,
    label: `Asset ${hasAsset ? "OK" : "-"} | Loadout ${hasLoadout ? "OK" : "-"} | Kontrakt ${hasCompletedContract ? "OK" : "-"}`,
    completed: current >= 3,
  };
}

function getTaskProgress(task, snapshot, now = Date.now()) {
  const player = snapshot?.player || {};
  const stats = snapshot?.stats || {};
  const gang = snapshot?.gang || {};
  const club = snapshot?.club || {};
  const objective = task?.objective || {};
  const target = Math.max(1, Number(objective?.target || 1));

  switch (objective.kind) {
    case "gym_pass": {
      const current =
        player?.gymPassTier === "perm" || Number(player?.gymPassUntil || 0) > now ? 1 : 0;
      return { current, target: 1, label: current ? "Karnet aktywny" : "Kup karnet", completed: current >= 1 };
    }
    case "heists_done": {
      const current = Math.min(target, Math.floor(asNumber(stats.heistsDone)));
      return { current, target, label: `${current}/${target} skoki`, completed: current >= target };
    }
    case "meals_eaten": {
      const current = Math.min(target, Math.floor(asNumber(stats.mealsEaten)));
      return { current, target, label: `${current}/${target} posilki`, completed: current >= target };
    }
    case "heals_used": {
      const current = Math.min(target, Math.floor(asNumber(stats.hospitalHeals)));
      return { current, target, label: `${current}/${target} leczenia`, completed: current >= target };
    }
    case "gym_trainings": {
      const current = Math.min(target, Math.floor(asNumber(stats.gymTrainings)));
      return { current, target, label: `${current}/${target} treningi`, completed: current >= target };
    }
    case "bank_deposit_total": {
      const current = Math.min(target, Math.floor(asNumber(stats.bankDepositedTotal)));
      return { current, target, label: `$${current}/$${target} w banku`, completed: current >= target };
    }
    case "market_trade_pair_count": {
      const bought = Math.floor(asNumber(stats.marketGoodsBought));
      const sold = Math.floor(asNumber(stats.marketGoodsSold));
      const current = Math.min(target, Math.min(bought, sold));
      return {
        current,
        target,
        label: `Kup ${bought}/${target} | Sprzedaj ${sold}/${target}`,
        completed: current >= target,
      };
    }
    case "heists_won": {
      const current = Math.min(target, Math.floor(asNumber(stats.heistsWon)));
      return { current, target, label: `${current}/${target} wygrane`, completed: current >= target };
    }
    case "respect_reached": {
      const current = Math.min(target, Math.floor(asNumber(player.respect)));
      return { current, target, label: `${current}/${target} RES`, completed: current >= target };
    }
    case "drugs_bought": {
      const current = Math.min(target, Math.floor(asNumber(stats.drugsBought)));
      return { current, target, label: `${current}/${target} zakupy`, completed: current >= target };
    }
    case "dealer_sales_value": {
      const current = Math.min(target, Math.floor(asNumber(stats.dealerDrugSalesValue)));
      return { current, target, label: `$${current}/$${target} u dilera`, completed: current >= target };
    }
    case "businesses_owned": {
      const current = Math.min(target, getOwnedBusinessCount(snapshot));
      return { current, target, label: `${current}/${target} biznesy`, completed: current >= target };
    }
    case "business_collections": {
      const current = Math.min(target, Math.floor(asNumber(stats.businessCollections)));
      return { current, target, label: `${current}/${target} odbiory`, completed: current >= target };
    }
    case "factories_owned": {
      const current = Math.min(target, getOwnedFactoryCount(snapshot));
      return { current, target, label: `${current}/${target} fabryki`, completed: current >= target };
    }
    case "drug_batches": {
      const current = Math.min(target, Math.floor(asNumber(stats.drugBatches)));
      return { current, target, label: `${current}/${target} batch`, completed: current >= target };
    }
    case "produced_drug_sales_value": {
      const current = Math.min(target, Math.floor(asNumber(stats.producedDrugSalesValue)));
      return { current, target, label: `$${current}/$${target} z produkcji`, completed: current >= target };
    }
    case "wealth_total": {
      const current = Math.min(target, Math.floor(asNumber(player.cash) + asNumber(player.bank)));
      return { current, target, label: `$${current}/$${target} lacznie`, completed: current >= target };
    }
    case "club_owned": {
      const current = club?.owned ? 1 : 0;
      return { current, target: 1, label: current ? "Lokal stoi" : "Przejmij lokal", completed: current >= 1 };
    }
    case "club_stash_moves": {
      const current = Math.min(target, Math.floor(asNumber(stats.clubStashMoves)));
      return { current, target, label: `${current}/${target} wrzutka`, completed: current >= target };
    }
    case "gang_joined": {
      const current = gang?.joined ? 1 : 0;
      return { current, target: 1, label: current ? "Masz ekipe" : "Wejdz do gangu", completed: current >= 1 };
    }
    case "gang_members": {
      const current = Math.min(target, Math.floor(asNumber(gang?.members)));
      return { current, target, label: `${current}/${target} ludzi`, completed: current >= target };
    }
    case "gang_vault_contributed": {
      const current = Math.min(target, Math.floor(asNumber(stats.gangVaultContributed)));
      return { current, target, label: `$${current}/$${target} do skarbca`, completed: current >= target };
    }
    case "gang_heists_participated": {
      const current = Math.min(target, Math.floor(asNumber(stats.gangHeistsParticipated)));
      return { current, target, label: `${current}/${target} napad gangu`, completed: current >= target };
    }
    case "district_presence":
      return getDistrictPresenceProgress(snapshot, objective);
    case "first_contract":
      return getFirstContractProgress(snapshot);
    case "operations_completed": {
      const current = Math.min(target, Math.floor(asNumber(stats.operationsCompleted)));
      return { current, target, label: `${current}/${target} operacje`, completed: current >= target };
    }
    default:
      return {
        current: 0,
        target,
        label: "W toku",
        completed: false,
      };
  }
}

export function findTaskById(taskId) {
  return (
    TASK_DEFINITIONS.find((task) => task.id === taskId) ||
    LEGACY_TASK_DEFINITIONS.find((task) => task.id === taskId) ||
    null
  );
}

function buildTaskState(task, snapshot, { mode = "offline_demo", now = Date.now() } = {}) {
  const claimedSet = new Set(Array.isArray(snapshot?.tasksClaimed) ? snapshot.tasksClaimed : []);
  const onlineMode = mode === "online_alpha";
  const onlineDisabled = onlineMode && task.onlineSupported === false;
  const progress = getTaskProgress(task, snapshot, now);
  const safeTarget = Math.max(1, Number(progress?.target || 1));
  const safeCurrent = Math.max(0, Math.min(safeTarget, Number(progress?.current || 0)));
  const rewardCash = Math.max(0, Number(task?.reward?.cash || 0));
  const rewardXp = Math.max(0, Number(task?.reward?.xp || 0));
  const rewardEnergy = Math.max(0, Number(task?.reward?.energy || 0));
  const rewardHp = Math.max(0, Number(task?.reward?.hp || 0));

  return {
    ...task,
    completed: Boolean(progress?.completed),
    claimed: claimedSet.has(task.id),
    onlineDisabled,
    disabledReason: onlineDisabled ? task.onlineDisabledReason || "Ta misja wroci pozniej." : "",
    rewardCash,
    rewardXp,
    rewardEnergy,
    rewardHp,
    progressCurrent: safeCurrent,
    progressTarget: safeTarget,
    progressRatio: progress?.completed ? 1 : safeCurrent / safeTarget,
    progressLabel: progress?.label || `${safeCurrent}/${safeTarget}`,
    statusTone: onlineDisabled ? "muted" : progress?.completed ? "claimable" : "active",
  };
}

export function getTaskStateById(taskId, snapshot, options = {}) {
  const task = findTaskById(taskId);
  if (!task) return null;
  return buildTaskState(task, snapshot, options);
}

export function getTaskStates(snapshot, { mode = "offline_demo", now = Date.now(), includeLegacy = false } = {}) {
  const definitions = includeLegacy
    ? [...TASK_DEFINITIONS, ...LEGACY_TASK_DEFINITIONS]
    : TASK_DEFINITIONS;
  return definitions
    .filter((task) => includeLegacy || !task.hiddenFromBoard)
    .map((task) => buildTaskState(task, snapshot, { mode, now }));
}

export function getTaskBoard(snapshot, { mode = "offline_demo", now = Date.now(), slotCount = TASK_BOARD_SLOT_COUNT } = {}) {
  const pendingTasks = getTaskStates(snapshot, { mode, now }).filter((task) => !task.claimed);
  const safeSlotCount = Math.max(1, Number(slotCount || TASK_BOARD_SLOT_COUNT));
  const visibleTasks = pendingTasks.slice(0, safeSlotCount);
  const claimableTasks = visibleTasks.filter((task) => task.completed && !task.onlineDisabled);
  const activeTasks = visibleTasks.filter((task) => !(task.completed && !task.onlineDisabled));
  const placeholderCount = Math.max(0, safeSlotCount - visibleTasks.length);

  return {
    slotCount: safeSlotCount,
    visibleTasks,
    claimableTasks,
    activeTasks,
    hiddenCount: Math.max(0, pendingTasks.length - visibleTasks.length),
    placeholders: Array.from({ length: placeholderCount }, (_, index) => ({
      id: `task-slot-${index + 1}`,
      title: "Nowe zlecenie",
      description: "Pojawi sie po robocie",
    })),
  };
}

export function getActiveTaskStates(snapshot, options = {}) {
  return getTaskBoard(snapshot, options).visibleTasks;
}
