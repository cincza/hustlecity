const VERBOSE_MUTATION_LOGS = process.env.VERBOSE_MUTATION_LOGS === "1";

function formatSnapshot(snapshot = {}) {
  return `cash=${snapshot.cash} bank=${snapshot.bank} energy=${snapshot.energy} hp=${snapshot.hp} heat=${snapshot.heat} respect=${snapshot.respect}`;
}

export function logMutationSuccess({ actionName, userId, before, after }) {
  if (!VERBOSE_MUTATION_LOGS) return;
  console.log(
    `[mutation] ${actionName} user=${userId} before(${formatSnapshot(before)}) after(${formatSnapshot(after)}) result=success`
  );
}

export function logMutationFailure({ actionName, userId, before, reason }) {
  console.error(
    `[mutation] ${actionName} user=${userId} before(${formatSnapshot(before)}) result=fail reason=${reason || "unknown"}`
  );
}
