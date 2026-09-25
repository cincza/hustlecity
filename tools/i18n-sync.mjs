import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { extractUserFacingStrings, buildSourceCatalog } from "./i18n-audit.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOCALE_DIR = path.join(ROOT, "src", "i18n", "locales");
const TARGETS = ["pl", "en", "de", "es"];
const PROTECTED_TERMS = [
  "Hustle City", "Old Town", "Neon Strip", "Harbor Line", "Ivo Varga", "Mara Voss",
  "Night Reign", "Cold Avenue", "Grey Saints", "Night Vultures", "Velvet Ash",
  "Heat", "HP", "XP", "RES", "EN",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeGameSlang(value) {
  return value
    .replace(/\bskoków\b/gi, "napadów rabunkowych")
    .replace(/\bskokow\b/gi, "napadow rabunkowych")
    .replace(/\bskokami\b/gi, "napadami rabunkowymi")
    .replace(/\bskokach\b/gi, "napadach rabunkowych")
    .replace(/\bskoki\b/gi, "napady rabunkowe")
    .replace(/\bskoku\b/gi, "napadu rabunkowego")
    .replace(/\bskokiem\b/gi, "napadem rabunkowym")
    .replace(/\bskok\b/gi, "napad rabunkowy");
}

function protect(value) {
  let result = normalizeGameSlang(value);
  const protectedValues = [];
  const terms = [...PROTECTED_TERMS];
  for (const term of terms) {
    const matcher = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, "gu");
    if (!matcher.test(result)) continue;
    matcher.lastIndex = 0;
    const token = `ZZHCN${protectedValues.length}ZZ`;
    protectedValues.push([token, term]);
    result = result.replace(matcher, token);
  }
  return { result, protectedValues };
}

function restore(value, protectedValues) {
  let result = value;
  for (const [token, original] of protectedValues) {
    result = result.split(token).join(original);
  }
  return result;
}

async function translateBatch(entries, sourceLanguage, targetLanguage) {
  if (sourceLanguage === targetLanguage) return Object.fromEntries(entries.map(([key, value]) => [key, value]));
  const protectedByKey = new Map();
  const text = entries.map(([key, value], index) => {
    const protectedText = protect(value);
    protectedByKey.set(key, protectedText.protectedValues);
    return `HCQ${String(index).padStart(4, "0")}\n${protectedText.result}`;
  }).join("\n");
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", sourceLanguage);
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);
  const response = await fetch(url, { headers: { "User-Agent": "HustleCityLocalization/1.0" } });
  if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
  const payload = await response.json();
  const translatedText = (payload?.[0] || []).map((part) => part?.[0] || "").join("");
  const result = {};
  const markerRe = /HCQ(\d{4})\s*\n([\s\S]*?)(?=\nHCQ\d{4}\s*\n|$)/g;
  for (const match of translatedText.matchAll(markerRe)) {
    const entry = entries[Number(match[1])];
    if (!entry) continue;
    result[entry[0]] = restore(match[2].trim(), protectedByKey.get(entry[0]) || []);
  }
  for (const [key, value] of entries) {
    if (!result[key]) result[key] = value;
  }
  return result;
}

function chunks(entries, maxChars = 4200) {
  const output = [];
  let current = [];
  let size = 0;
  for (const entry of entries) {
    const nextSize = entry[0].length + entry[1].length + 32;
    if (current.length && size + nextSize > maxChars) {
      output.push(current);
      current = [];
      size = 0;
    }
    current.push(entry);
    size += nextSize;
  }
  if (current.length) output.push(current);
  return output;
}

async function translateCatalog(catalog, sourceLanguage, targetLanguage) {
  const result = {};
  const batches = chunks(Object.entries(catalog));
  for (let index = 0; index < batches.length; index += 1) {
    Object.assign(result, await translateBatch(batches[index], sourceLanguage, targetLanguage));
    process.stdout.write(`\r${targetLanguage.toUpperCase()}: ${index + 1}/${batches.length}`);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  process.stdout.write("\n");
  return result;
}

async function main() {
  fs.mkdirSync(LOCALE_DIR, { recursive: true });
  const source = buildSourceCatalog(extractUserFacingStrings());
  fs.writeFileSync(path.join(LOCALE_DIR, "source.json"), `${JSON.stringify(source, null, 2)}\n`);

  const polish = { ...source };
  fs.writeFileSync(path.join(LOCALE_DIR, "pl.json"), `${JSON.stringify(polish, null, 2)}\n`);
  const onlyMissing = process.argv.includes("--missing");
  for (const locale of TARGETS.filter((entry) => entry !== "pl")) {
    const file = path.join(LOCALE_DIR, `${locale}.json`);
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
    const input = onlyMissing ? Object.fromEntries(Object.entries(polish).filter(([key]) => !existing[key])) : polish;
    const fresh = Object.keys(input).length ? await translateCatalog(input, "pl", locale) : {};
    const translated = Object.fromEntries(Object.keys(polish).map((key) => [key, fresh[key] || existing[key] || polish[key]]));
    fs.writeFileSync(path.join(LOCALE_DIR, `${locale}.json`), `${JSON.stringify(translated, null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
