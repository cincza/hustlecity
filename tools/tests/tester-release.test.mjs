import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { premiumConfiguration } from "../../backend/src/services/premiumService.js";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

test("tester build keeps checkout disabled unless the server switch is explicit", () => {
  const configured = { STRIPE_SECRET_KEY: "sk_test", STRIPE_WEBHOOK_SECRET: "whsec_test", PREMIUM_RETURN_URL: "https://example.test/return" };
  assert.equal(premiumConfiguration(configured).enabled, false);
  assert.equal(premiumConfiguration({ ...configured, PREMIUM_CHECKOUT_ENABLED: "1" }).enabled, true);
});

test("tester UI gates premium surfaces and exposes four-language privacy pages", () => {
  const contacts = fs.readFileSync(path.join(ROOT, "src/screens/ContactsScreen.js"), "utf8");
  const app = fs.readFileSync(path.join(ROOT, "App.js"), "utf8");
  const admin = fs.readFileSync(path.join(ROOT, "src/screens/AdminScreen.js"), "utf8");
  assert.match(contacts, /MONETIZATION_VISIBLE/);
  assert.match(app, /MONETIZATION_VISIBLE && game\.gang\.joined/);
  assert.doesNotMatch(admin, /\["premiumTokens"/);
  for (const name of ["privacy", "delete-account"]) {
    const html = fs.readFileSync(path.join(ROOT, "public", name, "index.html"), "utf8");
    for (const locale of ["pl", "en", "de", "es"]) assert.match(html, new RegExp(`data-lang="${locale}"`));
  }
});

test("web export pipeline copies public account pages into the deployable artifact", () => {
  const packageJson = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
  const copyTool = fs.readFileSync(path.join(ROOT, "tools", "copy-public-pages.mjs"), "utf8");
  assert.match(packageJson, /expo export --platform web && node tools\/copy-public-pages\.mjs/);
  assert.match(copyTool, /\["privacy", "delete-account"\]/);
});
