import test from "node:test";
import assert from "node:assert/strict";
import { requestJson, isInvalidSession } from "../../shared/http.js";

test("only an authentication rejection invalidates a saved session", async () => {
  for (const status of [401, 409, 429, 500, 503]) {
    await assert.rejects(requestJson("https://game.test", "/me", {}, async () => new Response('{"error":"Unavailable"}', { status })), (error) => {
      assert.equal(error.status, status);
      assert.equal(isInvalidSession(error), status === 401);
      return true;
    });
  }
  await assert.rejects(requestJson("https://game.test", "/me", {}, async () => { throw new TypeError("network"); }), (error) => !isInvalidSession(error));
});

test("profile conflicts retry reads, but economic POSTs are never replayed", async () => {
  let calls = 0;
  const data = await requestJson("https://game.test", "/me", {}, async () => ++calls === 1 ? new Response("{}", { status: 409 }) : new Response('{"cash":100}'));
  assert.equal(data.cash, 100);
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(requestJson("https://game.test", "/market/buy", { method: "POST", body: { quantity: 1 } }, async () => { calls++; return new Response("{}", { status: 409 }); }));
  assert.equal(calls, 1);
});

test("the timeout covers response body reads and invalid JSON is rejected", async () => {
  await assert.rejects(requestJson("https://game.test", "/me", { timeoutMs: 10 }, async (_url, { signal }) => ({ text: () => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error(), { name: "AbortError" })))) })), /długo/);
  await assert.rejects(requestJson("https://game.test", "/me", {}, async () => new Response("<html>proxy error</html>")), /nieprawidłową/);
});
