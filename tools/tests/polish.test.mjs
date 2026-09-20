import test from "node:test";
import assert from "node:assert/strict";
import { CONTACT_CLASSES } from "../../shared/contacts.js";
import { DISTRICTS } from "../../shared/districts.js";
import { RIVAL_ARCHETYPES } from "../../shared/rivals.js";

test("każda klasa ma kompletną i rozpoznawalną prezentację bez wpływu na balans", () => {
  assert.equal(CONTACT_CLASSES.length, 5);
  for (const entry of CONTACT_CLASSES) {
    assert.ok(entry.icon && entry.accent && entry.fantasy && entry.hook && entry.voice);
    assert.equal(entry.strengths.length, 3);
    assert.ok(Number.isFinite(entry.energy));
    assert.ok(Number.isFinite(entry.reward));
  }
  assert.equal(new Set(CONTACT_CLASSES.map((entry) => entry.contact)).size, CONTACT_CLASSES.length);
  assert.equal(new Set(CONTACT_CLASSES.map((entry) => entry.accent)).size, CONTACT_CLASSES.length);
});

test("dzielnice i rywale mają odrębny język oraz sygnały wizualne", () => {
  assert.equal(DISTRICTS.length, 3);
  assert.equal(new Set(DISTRICTS.map((entry) => entry.accent)).size, DISTRICTS.length);
  assert.equal(new Set(DISTRICTS.map((entry) => entry.icon)).size, DISTRICTS.length);
  for (const district of DISTRICTS) {
    assert.ok(district.signature.length > 20);
    assert.ok(district.streetLine.length > 30);
    const rival = RIVAL_ARCHETYPES[district.id];
    assert.ok(rival?.sigil && rival?.quote && rival?.warning && rival?.final);
  }
  assert.equal(new Set(Object.values(RIVAL_ARCHETYPES).map((entry) => entry.quote)).size, 3);
});
