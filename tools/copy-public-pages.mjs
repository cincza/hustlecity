import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicRoot = path.join(root, "public");
const outputRoot = path.join(root, "dist");
const pages = ["privacy", "delete-account"];

await fs.mkdir(outputRoot, { recursive: true });
for (const page of pages) {
  const source = path.join(publicRoot, page);
  const target = path.join(outputRoot, page);
  await fs.rm(target, { recursive: true, force: true });
  await fs.cp(source, target, { recursive: true, errorOnExist: false });
}

console.log(`Skopiowano strony publiczne do dist: ${pages.join(", ")}.`);
