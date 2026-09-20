import test from "node:test";
import assert from "node:assert/strict";
import { getTaskBoard, getTaskStateById, STARTER_TASK_IDS } from "../../shared/tasks.js";
import { getStarterJourney, getTaskDestination } from "../../shared/taskGuidance.js";
import { claimTaskForPlayer } from "../../backend/src/services/empireActionService.js";

test("new players see four actionable first steps before conditional food and healing tasks", () => {
  const board = getTaskBoard({ player: {}, stats: {}, tasksClaimed: [] });
  assert.deepEqual(board.visibleTasks.slice(0, 4).map((task) => task.id), STARTER_TASK_IDS);
  assert.deepEqual(board.visibleTasks.slice(0, 4).map((task) => {
    const destination = getTaskDestination(task);
    return [destination.tab, destination.section];
  }), [["heists", "solo"], ["city", "gym"], ["city", "bank"], ["market", "street"]]);
});

test("one attempted heist unlocks the first reward even after a loss; one training completes the next", () => {
  const snapshot = { player: {}, stats: { heistsDone: 1, heistsWon: 0, gymTrainings: 1 } };
  assert.equal(getTaskStateById("pierwszy-skok", snapshot).completed, true);
  assert.equal(getTaskStateById("pierwszy-trening", snapshot).completed, true);
  const player = { profile: { cash: 0, hp: 100, maxHp: 100, energy: 10, maxEnergy: 20 }, stats: snapshot.stats };
  const result = claimTaskForPlayer(player, "pierwszy-skok");
  assert.equal(result.rewardCash, 1500);
  assert.equal(player.profile.cash, 1500);
  assert.throws(() => claimTaskForPlayer(player, "pierwszy-skok"), /odebrana/);
  assert.equal(player.profile.cash, 1500);
});

test("guide prioritizes unclaimed rewards, preserves old claims and disappears after four claims", () => {
  const snapshot = { player: {}, stats: { bankDepositedTotal: 3000 }, tasksClaimed: ["pierwszy-skok"] };
  const journey = getStarterJourney(snapshot);
  assert.equal(journey.current.id, "schowaj-hajs");
  assert.equal(journey.claimedCount, 1);
  snapshot.tasksClaimed = [...STARTER_TASK_IDS];
  assert.equal(getStarterJourney(snapshot).finished, true);
  assert.equal(getStarterJourney(snapshot).current, null);
  assert.ok(getTaskBoard(snapshot).visibleTasks.every((task) => !STARTER_TASK_IDS.includes(task.id)));
});

test("trading requires both buying and selling, and inactive tasks have no action destination", () => {
  assert.equal(getTaskStateById("maly-obrot", { stats: { marketGoodsBought: 3, marketGoodsSold: 0 } }).completed, false);
  assert.equal(getTaskStateById("maly-obrot", { stats: { marketGoodsBought: 3, marketGoodsSold: 3 } }).completed, true);
  assert.equal(getTaskDestination({ onlineDisabled: true, objective: { kind: "heists_done" } }), null);
  assert.equal(getTaskDestination({ claimed: true, objective: { kind: "heists_done" } }), null);
});
