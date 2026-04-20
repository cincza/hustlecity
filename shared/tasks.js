export const TASK_DEFINITIONS = [
  {
    id: "gym-pass",
    title: "Wejdz na silownie",
    description: "Kup dowolny karnet na silownie.",
    rewardCash: 500,
    rewardXp: 6,
    onlineSupported: true,
  },
  {
    id: "first-wave",
    title: "Pierwsza fala napadow",
    description: "Wykonaj 3 napady.",
    rewardCash: 900,
    rewardXp: 7,
    onlineSupported: true,
  },
  {
    id: "crew",
    title: "Rozbuduj ekipe",
    description: "Miej przynajmniej 6 ludzi w gangu.",
    rewardCash: 1300,
    rewardXp: 9,
    onlineSupported: false,
    onlineDisabledReason: "Ta misja wroci, gdy gang bedzie w pelni liczony serwerowo.",
  },
  {
    id: "lab",
    title: "Odpal pierwsza partie",
    description: "Wyprodukuj 2 partie dragow.",
    rewardCash: 2000,
    rewardXp: 10,
    onlineSupported: true,
  },
  {
    id: "club",
    title: "Otworz klub",
    description: "Przejmij lub otworz swoj klub.",
    rewardCash: 3000,
    rewardXp: 12,
    onlineSupported: true,
  },
];

function hasGymPassLike(player, now = Date.now()) {
  return player?.gymPassTier === "perm" || Number(player?.gymPassUntil || 0) > now;
}

function isTaskCompleted(taskId, snapshot, now = Date.now()) {
  const player = snapshot?.player || {};
  const stats = snapshot?.stats || {};
  const gang = snapshot?.gang || {};
  const club = snapshot?.club || {};

  switch (taskId) {
    case "gym-pass":
      return hasGymPassLike(player, now);
    case "first-wave":
      return Number(stats.heistsDone || 0) >= 3;
    case "crew":
      return Number(gang.members || 0) >= 6;
    case "lab":
      return Number(stats.drugBatches || 0) >= 2;
    case "club":
      return Boolean(club.owned);
    default:
      return false;
  }
}

export function findTaskById(taskId) {
  return TASK_DEFINITIONS.find((task) => task.id === taskId) || null;
}

export function getTaskStates(snapshot, { mode = "offline_demo", now = Date.now() } = {}) {
  const claimedSet = new Set(Array.isArray(snapshot?.tasksClaimed) ? snapshot.tasksClaimed : []);
  const onlineMode = mode === "online_alpha";

  return TASK_DEFINITIONS.map((task) => {
    const onlineDisabled = onlineMode && task.onlineSupported === false;
    return {
      ...task,
      completed: isTaskCompleted(task.id, snapshot, now),
      claimed: claimedSet.has(task.id),
      onlineDisabled,
      disabledReason: onlineDisabled ? task.onlineDisabledReason || "Ta misja wroci pozniej." : "",
    };
  });
}

export function getActiveTaskStates(snapshot, options = {}) {
  return getTaskStates(snapshot, options).filter((task) => !task.claimed);
}
