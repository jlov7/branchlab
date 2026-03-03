import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "..");
const lockPath = join(root, "pnpm-lock.yaml");
const lockSha = createHash("sha256").update(readFileSync(lockPath, "utf8")).digest("hex");

const metadata = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  lockfileSha256: lockSha,
};

mkdirSync(join(root, "artifacts"), { recursive: true });
writeFileSync(join(root, "artifacts/build-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
process.stdout.write("artifacts/build-metadata.json\n");
