import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function listFiles(target) {
  if (!fs.existsSync(target)) return [];
  if (fs.statSync(target).isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(target, entry.name);
    return entry.isDirectory() ? listFiles(child) : entry.name.endsWith(".js") ? [child] : [];
  });
}

for (const file of [path.join(ROOT, "App.js"), ...listFiles(path.join(ROOT, "src"))]) {
  if (file.endsWith(path.join("src", "i18n", "index.js"))) continue;
  let code = fs.readFileSync(file, "utf8");
  const localized = new Set();
  code = code.replace(/import\s*\{([\s\S]*?)\}\s*from\s*["']react-native["'];?/g, (full, contents) => {
    const specifiers = contents.split(",").map((entry) => entry.trim()).filter(Boolean);
    const kept = specifiers.filter((entry) => {
      const imported = entry.split(/\s+as\s+/)[0];
      if (["Text", "TextInput", "Alert"].includes(imported)) {
        localized.add(imported);
        return false;
      }
      return true;
    });
    return kept.length ? `import { ${kept.join(", ")} } from "react-native";` : "";
  });
  if (!localized.size) continue;
  const relative = file === path.join(ROOT, "App.js") ? "./src/i18n" : "../i18n";
  const localizedImport = `import { ${[...localized].sort().join(", ")} } from "${relative}";`;
  const importEnd = [...code.matchAll(/^import .*;\s*$/gm)].at(-1);
  if (importEnd) {
    const position = importEnd.index + importEnd[0].length;
    code = `${code.slice(0, position)}\n${localizedImport}${code.slice(position)}`;
  } else {
    code = `${localizedImport}\n${code}`;
  }
  fs.writeFileSync(file, code);
  console.log(path.relative(ROOT, file));
}

