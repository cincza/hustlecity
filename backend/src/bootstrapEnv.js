import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, "..");
const configuredEnvFile = String(process.env.BACKEND_ENV_FILE || "").trim();

dotenv.config({
  path: configuredEnvFile
    ? path.resolve(configuredEnvFile)
    : path.join(backendRootDir, ".env"),
});
