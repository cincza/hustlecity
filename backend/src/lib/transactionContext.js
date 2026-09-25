import { AsyncLocalStorage } from "node:async_hooks";

const transactions = new AsyncLocalStorage();

export function currentTransaction() {
  const context = transactions.getStore();
  return context?.active ? context : null;
}

export async function inTransactionContext(handler) {
  const context = {
    active: true,
    players: new Map(),
    documents: new Map(),
    authentication: new Map(),
    deletedUsers: new Map(),
    adminAudits: [],
    accountDeletionCleanups: [],
    adminAuditRedactions: new Set(),
    afterCommit: [],
    cleanup: [],
  };
  return transactions.run(context, async () => {
    try { return await handler(context); }
    finally {
      context.active = false;
      for (const release of context.cleanup.reverse()) release();
    }
  });
}

export function afterCommit(callback) {
  const context = currentTransaction();
  if (context) context.afterCommit.push(callback);
  else callback();
}

export function afterTransaction(callback) {
  const context = currentTransaction();
  if (context) context.cleanup.push(callback);
  else callback();
}
