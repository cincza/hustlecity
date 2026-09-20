import { API_BASE_URL } from "../../constants/env";
import { requestJson } from "../../../shared/http.js";
import { isTransactionalAction } from "../../../shared/transactions.js";
import { createTransactionClient } from "../../../shared/transactionClient.js";
import { operationStorage } from "../../services/operationStorage";

const transactionalRequest = createTransactionClient({
  storage: operationStorage,
  send: (path, options) => requestJson(API_BASE_URL, path, options),
});

export function request(path, options = {}) {
  if (options.token && isTransactionalAction(path, options.method || "GET")) return transactionalRequest(path, options);
  return requestJson(API_BASE_URL, path, options);
}
