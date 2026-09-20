import test from "node:test";
import assert from "node:assert/strict";
import { CAREER_CHAPTERS, getCareer } from "../../shared/career.js";
import { getTaskBoard, STARTER_TASK_IDS } from "../../shared/tasks.js";
import { BUSINESSES } from "../../shared/empire.js";

test("career references existing tasks and advances using saved claims without resetting progress", () => {
  const claimed = [];
  for (const chapter of CAREER_CHAPTERS) {
    const career = getCareer({ player: {}, tasksClaimed: claimed });
    assert.equal(career.id, chapter.id);
    assert.ok(career.steps.every((step) => step?.id));
    claimed.push(...chapter.tasks);
  }
  const complete = getCareer({ tasksClaimed: claimed });
  assert.equal(complete.finished, true);
  assert.equal(complete.current, null);
});

test("investment guidance distinguishes missing respect, bank funds and cash", () => {
  const base = { tasksClaimed: [...STARTER_TASK_IDS, "piec-wejsc"] };
  const business = BUSINESSES[0];
  assert.equal(getCareer({ ...base, player: { respect: 1 } }).destination.tab, "heists");
  const funded = { respect: business.respect, cash: 0, bank: business.cost };
  assert.equal(getCareer({ ...base, player: funded }).destination.section, "bank");
  assert.equal(getCareer({ ...base, player: { ...funded, cash: business.cost } }).destination.section, "businesses");
});

test("ready chapter rewards take priority and completed missions cannot remain buried on the board", () => {
  const snapshot = { tasksClaimed: STARTER_TASK_IDS, businessesOwned: [{ id: BUSINESSES[0].id, count: 1 }] };
  assert.equal(getCareer(snapshot).current.id, "pierwszy-biznes");
  assert.equal(getTaskBoard(snapshot).visibleTasks[0].id, "pierwszy-biznes");
});
