import { ECONOMY_RULES } from "./economy.js";

export function syncPlayerHeat(player, now = Date.now()) {
  player.timers ||= {};
  const previous = Number(player.timers.heatUpdatedAt);
  const last = Number.isFinite(previous) ? Math.min(previous, now) : now;
  const interval = 15 * 60000;
  const ticks = Math.floor(Math.max(0, now - last) / interval);
  player.profile.heat = Math.max(0, Math.round(Number(player.profile.heat || 0)) - ticks);
  player.timers.heatUpdatedAt = player.profile.heat === 0 ? now : last + ticks * interval;
}

export function syncPlayerEnergy(player, now = Date.now()) {
  player.timers ||= {};
  const regenMs = ECONOMY_RULES.energy.regenSeconds * 1000;
  const recordedAt = Number(player.timers.energyUpdatedAt);
  const lastAt = Number.isFinite(recordedAt) ? Math.min(recordedAt, now) : now;
  if (player.profile.energy >= player.profile.maxEnergy) {
    player.timers.energyUpdatedAt = now;
    return;
  }
  const recovered = Math.floor(Math.max(0, now - lastAt) / regenMs);
  player.profile.energy = Math.min(player.profile.maxEnergy, player.profile.energy + recovered);
  player.timers.energyUpdatedAt = player.profile.energy >= player.profile.maxEnergy
    ? now
    : lastAt + recovered * regenMs;
}
