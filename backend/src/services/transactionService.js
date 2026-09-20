import crypto from "node:crypto";
import { isTransactionalAction, canonicalJson, OPERATION_RETENTION_MS } from "../../../shared/transactions.js";
import { inTransactionContext } from "../lib/transactionContext.js";
import { readOperationReceipt, commitGameTransaction } from "../lib/gameDatabase.js";
import { logError } from "../utils/logger.js";

const pending = new Set();
const fail = (message, code, statusCode = 409) => Object.assign(new Error(message), { code, statusCode });

export async function runTransactionalAction(req, res, handler) {
  if (!req.user?.id || !isTransactionalAction(req.path, req.method)) return handler(req, res);
  const key = req.get("Idempotency-Key");
  let receipt;
  let pendingKey;
  if (key) {
    const match = /^(\d{13})-([a-zA-Z0-9_-]{16,96})$/.exec(key);
    if (!match) throw fail("Nieprawidłowy identyfikator operacji.", "invalid_operation_key", 400);
    const age = Date.now() - Number(match[1]);
    if (age < -5 * 60 * 1000) throw fail("Sprawdź datę i godzinę urządzenia.", "operation_clock_skew", 400);
    if (age >= OPERATION_RETENTION_MS) throw fail("Potwierdzenie tej operacji wygasło. Sprawdź aktualny stan konta przed nową akcją.", "operation_expired", 410);
    const hash = crypto.createHash("sha256").update(`${req.method}\n${req.originalUrl}\n${canonicalJson(req.body)}`).digest("hex");
    const previous = await readOperationReceipt(req.user.id, key);
    if (previous) {
      if (previous.hash !== hash) throw fail("Ten identyfikator dotyczy innej operacji.", "operation_key_reused");
      res.setHeader("Idempotency-Replayed", "true");
      return res.status(previous.status).json(previous.body);
    }
    pendingKey = `${req.user.id}:${key}`;
    if (pending.has(pendingKey)) throw fail("Ta operacja jest jeszcze rozliczana.", "operation_in_progress");
    pending.add(pendingKey);
    receipt = { actorId: req.user.id, key, hash };
  }

  const originalJson = res.json;
  let body;
  let responseCaptured = false;
  // Express headers/body must not leave the process before the database commit succeeds.
  res.json = function captureResponse(value) {
    if (responseCaptured) throw new Error("Transaction attempted to send more than one response");
    body = JSON.parse(JSON.stringify(value));
    responseCaptured = true;
    return this;
  };
  try {
    await inTransactionContext(async (context) => {
      await handler(req, res);
      if (!responseCaptured) throw new Error("Transactional action did not produce a JSON response");
      if (res.statusCode >= 400) return;
      await commitGameTransaction(context, receipt ? { ...receipt, status: res.statusCode, body } : null);
      context.active = false;
      for (const publish of context.afterCommit) {
        // Delivery failure after a durable commit must not turn a successful payment into an error.
        try { publish(); } catch (error) { logError("transaction", "notification-failed", { message: error.message }); }
      }
    });
  } finally {
    res.json = originalJson;
    if (pendingKey) pending.delete(pendingKey);
  }
  return res.json(body);
}
