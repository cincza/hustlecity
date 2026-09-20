import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseSync } = require("@babel/core");
const root = path.resolve(import.meta.dirname, "..");
const files = ["App.js", "api.js"];
async function collect(directory) {
  for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(relative);
    else if (/\.(mjs|js)$/.test(entry.name)) files.push(relative);
  }
}
for (const directory of ["src", "shared", "backend/src", "tools/tests"]) await collect(directory);
let failures = 0;
for (const file of files) {
  try {
    parseSync(await fs.readFile(path.join(root, file), "utf8"), {
      filename: file, configFile: false, babelrc: false,
      sourceType: "unambiguous", parserOpts: { plugins: ["jsx"] },
    });
  } catch (error) { failures++; console.error(`${file}: ${error.message}`); }
}
console.log(`Sprawdzono składnię ${files.length} plików JS/JSX. Błędy: ${failures}.`);
process.exitCode = failures ? 1 : 0;
