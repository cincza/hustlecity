import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const parser = require("@babel/parser");
const traverseModule = require("@babel/traverse");
const traverse = traverseModule.default || traverseModule;

const ROOT = path.resolve(import.meta.dirname, "..");
const LOCALE_DIR = path.join(ROOT, "src", "i18n", "locales");
const SOURCE_FILE = path.join(LOCALE_DIR, "source.json");
const LOCALES = ["pl", "en", "de", "es"];
const SOURCE_ROOTS = [path.join(ROOT, "App.js"), path.join(ROOT, "src"), path.join(ROOT, "shared"), path.join(ROOT, "backend", "src")];

const DISPLAY_KEYS = new Set([
  "action", "actionLabel", "body", "caption", "choiceName", "confirmLabel", "description", "detail",
  "empty", "emptyText", "error", "eyebrow", "failure", "feedback", "headline", "hint", "label", "message",
  "meta", "name", "note", "placeholder", "prompt", "reason", "requirement", "result", "statusLabel", "subtitle",
  "success", "summary", "text", "title", "tooltip", "warning",
]);
const DISPLAY_CALL_RE = /^(alert|confirm|fail|pushLog|set.*(?:Error|Feedback|Message|Notice|Status)|toast)$/i;
const TECHNICAL_KEYS = new Set([
  "id", "key", "code", "type", "kind", "tone", "icon", "visual", "route", "method", "scope", "category",
  "classId", "districtId", "operationId", "projectId", "resource", "path", "url", "event", "status",
]);

function listFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) return listFiles(child);
    return /\.(?:js|jsx|mjs)$/.test(entry.name) ? [child] : [];
  });
}

function canonical(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function looksUserFacing(value, kind = "literal") {
  const text = canonical(value);
  if (text.length < 2 || !/\p{L}/u.test(text)) return false;
  if (/^(?:https?:|wss?:|\.\.?[\\/]|[A-Za-z]:[\\/]|#[0-9a-f]{3,8}$)/i.test(text)) return false;
  if (/^[a-z0-9_./:@-]+$/.test(text) && !text.includes(" ") && kind === "literal") return false;
  return true;
}

function keyName(node) {
  if (!node) return "";
  if (node.type === "Identifier") return node.name;
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return "";
}

function expressionPattern(node) {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((part, index) => `${part.value.cooked ?? part.value.raw}${index < node.expressions.length ? `{${index}}` : ""}`).join("");
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = expressionPattern(node.left);
    const right = expressionPattern(node.right);
    if (left !== null && right !== null) return `${left}${right}`;
  }
  return null;
}

function calleeName(node) {
  if (!node) return "";
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") return keyName(node.property);
  return "";
}

export function extractUserFacingStrings() {
  const found = new Map();
  const add = (raw, file, line, kind) => {
    const value = canonical(raw);
    if (!looksUserFacing(value, kind)) return;
    const location = `${path.relative(ROOT, file).replaceAll("\\", "/")}:${line || 1}`;
    const existing = found.get(value) || { value, locations: [], kinds: new Set() };
    if (existing.locations.length < 8 && !existing.locations.includes(location)) existing.locations.push(location);
    existing.kinds.add(kind);
    found.set(value, existing);
  };

  const files = SOURCE_ROOTS.flatMap(listFiles).filter((file, index, all) => all.indexOf(file) === index);
  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    let ast;
    try {
      ast = parser.parse(code, { sourceType: "module", plugins: ["jsx", "optionalChaining", "nullishCoalescingOperator"] });
    } catch (error) {
      console.error(`Nie mozna sparsowac ${path.relative(ROOT, file)}: ${error.message}`);
      process.exitCode = 1;
      continue;
    }

    traverse(ast, {
      JSXText(nodePath) {
        add(nodePath.node.value, file, nodePath.node.loc?.start.line, "jsx");
      },
      JSXAttribute(nodePath) {
        const name = keyName(nodePath.node.name);
        const valueNode = nodePath.node.value;
        if (!DISPLAY_KEYS.has(name) || !valueNode) return;
        if (valueNode.type === "StringLiteral") add(valueNode.value, file, valueNode.loc?.start.line, `prop:${name}`);
        if (valueNode.type === "JSXExpressionContainer") {
          const value = expressionPattern(valueNode.expression);
          if (value !== null) add(value, file, valueNode.loc?.start.line, `prop:${name}`);
        }
      },
      StringLiteral(nodePath) {
        if (nodePath.parentPath?.isImportDeclaration?.() || (nodePath.parentPath?.isExportNamedDeclaration?.() && nodePath.parentPath.node.source === nodePath.node)) return;
        const objectProperty = nodePath.findParent((parent) => parent.isObjectProperty?.());
        if (objectProperty) {
          const name = keyName(objectProperty.node.key);
          if (TECHNICAL_KEYS.has(name)) return;
          if (DISPLAY_KEYS.has(name)) add(nodePath.node.value, file, nodePath.node.loc?.start.line, `field:${name}`);
        }
        if (nodePath.findParent((parent) => parent.isJSXExpressionContainer?.())) {
          add(nodePath.node.value, file, nodePath.node.loc?.start.line, "jsx-expression");
        }
        const call = nodePath.findParent((parent) => parent.isCallExpression?.());
        if (call && DISPLAY_CALL_RE.test(calleeName(call.node.callee))) {
          add(nodePath.node.value, file, nodePath.node.loc?.start.line, `call:${calleeName(call.node.callee)}`);
        }
        const parentProperty = nodePath.parentPath?.isObjectProperty?.() ? keyName(nodePath.parentPath.node.key) : "";
        const isPropertyKey = nodePath.parentPath?.isObjectProperty?.() && nodePath.parentPath.node.key === nodePath.node;
        if (!isPropertyKey && !TECHNICAL_KEYS.has(parentProperty)) {
          add(nodePath.node.value, file, nodePath.node.loc?.start.line, "literal");
        }
      },
      TemplateLiteral(nodePath) {
        const pattern = expressionPattern(nodePath.node);
        if (pattern === null) return;
        const inJsx = nodePath.findParent((parent) => parent.isJSXExpressionContainer?.());
        const objectProperty = nodePath.findParent((parent) => parent.isObjectProperty?.());
        const call = nodePath.findParent((parent) => parent.isCallExpression?.());
        const objectKey = objectProperty ? keyName(objectProperty.node.key) : "";
        const callName = call ? calleeName(call.node.callee) : "";
        if (!TECHNICAL_KEYS.has(objectKey)) add(pattern, file, nodePath.node.loc?.start.line, inJsx ? "jsx-template" : `template:${objectKey || callName || "literal"}`);
      },
    });
  }

  return [...found.values()].sort((a, b) => a.value.localeCompare(b.value, "pl"));
}

function stableKey(value) {
  return `auto.${crypto.createHash("sha1").update(value).digest("hex").slice(0, 14)}`;
}

export function buildSourceCatalog(entries) {
  return Object.fromEntries(entries.map((entry) => [stableKey(entry.value), entry.value]));
}

function loadJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
}

function main() {
  const entries = extractUserFacingStrings();
  const source = buildSourceCatalog(entries);
  const existingSource = loadJson(SOURCE_FILE);
  const newValues = new Set(Object.values(source));
  const existingValues = new Set(Object.values(existingSource));
  const added = [...newValues].filter((value) => !existingValues.has(value));
  const removed = [...existingValues].filter((value) => !newValues.has(value));

  const localeStats = {};
  let failures = 0;
  for (const locale of LOCALES) {
    const resource = loadJson(path.join(LOCALE_DIR, `${locale}.json`));
    const missing = Object.keys(source).filter((key) => !resource[key] || !String(resource[key]).trim());
    const extra = Object.keys(resource).filter((key) => !source[key]);
    localeStats[locale] = { keys: Object.keys(resource).length, missing: missing.length, extra: extra.length };
    failures += missing.length;
  }

  const report = {
    scannedFiles: SOURCE_ROOTS.flatMap(listFiles).length,
    extractedKeys: Object.keys(source).length,
    addedSinceCatalog: added.length,
    removedSinceCatalog: removed.length,
    locales: localeStats,
  };
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--write-source")) {
    fs.mkdirSync(LOCALE_DIR, { recursive: true });
    fs.writeFileSync(SOURCE_FILE, `${JSON.stringify(source, null, 2)}\n`);
    fs.writeFileSync(path.join(LOCALE_DIR, "audit-meta.json"), `${JSON.stringify(Object.fromEntries(entries.map((entry) => [stableKey(entry.value), { locations: entry.locations, kinds: [...entry.kinds] }])), null, 2)}\n`);
    console.log(`Zapisano ${Object.keys(source).length} kluczy zrodlowych.`);
  } else if (failures || added.length || removed.length) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) main();
