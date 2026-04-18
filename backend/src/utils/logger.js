function serializeFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}

function log(level, scope, event, fields = {}) {
  const entry = {
    time: new Date().toISOString(),
    level,
    scope,
    event,
    ...serializeFields(fields),
  };
  console[level === "error" ? "error" : "log"](JSON.stringify(entry));
}

export function logInfo(scope, event, fields = {}) {
  log("info", scope, event, fields);
}

export function logWarn(scope, event, fields = {}) {
  log("warn", scope, event, fields);
}

export function logError(scope, event, fields = {}) {
  log("error", scope, event, fields);
}
