import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildSourceCatalog, extractUserFacingStrings } from "../i18n-audit.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const DIR = path.join(ROOT, "src", "i18n", "locales");
const read = (name) => JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), "utf8"));
const source = read("source");
const resources = Object.fromEntries(["pl", "en", "de", "es"].map((locale) => [locale, read(locale)]));

function placeholders(value) {
  return [...String(value).matchAll(/\{(\d+)\}/g)].map((match) => match[1]).sort();
}

test("all locale catalogs have exactly the source keys", () => {
  const expected = Object.keys(source).sort();
  assert.ok(expected.length > 4000);
  for (const [locale, resource] of Object.entries(resources)) {
    assert.deepEqual(Object.keys(resource).sort(), expected, `${locale} has a different key set`);
    assert.equal(Object.values(resource).filter((value) => !String(value).trim()).length, 0, `${locale} has blank translations`);
  }
});

test("dynamic placeholders survive every translation", () => {
  for (const [key, sourceText] of Object.entries(source)) {
    const expected = placeholders(sourceText);
    for (const [locale, resource] of Object.entries(resources)) {
      assert.deepEqual(placeholders(resource[key]), expected, `${locale}:${key} changed placeholders`);
    }
  }
});

test("proper names remain unchanged", () => {
  const protectedNames = ["Hustle City", "Old Town", "Neon Strip", "Harbor Line", "Ivo Varga", "Mara Voss"];
  for (const [key, sourceText] of Object.entries(source)) {
    for (const name of protectedNames) {
      if (!sourceText.includes(name)) continue;
      for (const [locale, resource] of Object.entries(resources)) {
        assert.ok(resource[key].includes(name), `${locale}:${key} changed ${name}`);
      }
    }
  }
});

test("catalog is current with source audit", () => {
  assert.deepEqual(buildSourceCatalog(extractUserFacingStrings()), source);
});

test("user-facing React Native text uses localization adapters", () => {
  const files = [path.join(ROOT, "App.js")];
  for (const folder of ["components", "screens"]) {
    for (const name of fs.readdirSync(path.join(ROOT, "src", folder))) {
      if (name.endsWith(".js")) files.push(path.join(ROOT, "src", folder, name));
    }
  }
  const offenders = files.filter((file) => /import\s*\{[^}]*\b(?:Text|TextInput|Alert)\b[^}]*\}\s*from\s*["']react-native["']/s.test(fs.readFileSync(file, "utf8")));
  assert.deepEqual(offenders.map((file) => path.relative(ROOT, file)), []);
});

