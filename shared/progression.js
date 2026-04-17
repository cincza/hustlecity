function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getXpRequirementForRespect(respect = 1) {
  const normalizedRespect = Math.max(1, Math.floor(Number(respect) || 1));
  return 45 + (normalizedRespect - 1) * 20;
}

export function getRespectInfo(respect = 1, xp = 0) {
  const currentRespect = Math.max(1, Math.floor(Number(respect) || 1));
  const requirement = getXpRequirementForRespect(currentRespect);
  const currentXp = clamp(Math.floor(Number(xp) || 0), 0, requirement);

  return {
    level: currentRespect,
    currentXp,
    requirement,
    progress: requirement > 0 ? currentXp / requirement : 1,
    xpRemaining: Math.max(0, requirement - currentXp),
    nextLevel: currentRespect + 1,
  };
}

export function applyXpProgression({ respect = 1, xp = 0 } = {}, xpGain = 0) {
  let currentRespect = Math.max(1, Math.floor(Number(respect) || 1));
  let currentXp = Math.max(0, Math.floor(Number(xp) || 0));
  const appliedXpGain = Math.max(0, Math.floor(Number(xpGain) || 0));
  let levelsGained = 0;

  currentXp += appliedXpGain;

  while (currentXp >= getXpRequirementForRespect(currentRespect)) {
    currentXp -= getXpRequirementForRespect(currentRespect);
    currentRespect += 1;
    levelsGained += 1;
  }

  return {
    respect: currentRespect,
    xp: currentXp,
    xpGain: appliedXpGain,
    levelsGained,
    ...getRespectInfo(currentRespect, currentXp),
  };
}
