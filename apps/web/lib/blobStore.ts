import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { BLOBS_DIR, ensureAtlDirs } from "./paths";

const knownBlobShas = new Set<string>();
const knownShardDirs = new Set<string>();
let blobDirsEnsured = false;

export function writeBlobJson(value: unknown): string {
  ensureBlobDirs();
  const json = JSON.stringify(value);
  const sha = createHash("sha256").update(json).digest("hex");
  if (knownBlobShas.has(sha)) {
    return sha;
  }

  const target = blobPath(sha);

  try {
    writeFileSync(target, `${json}\n`, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  knownBlobShas.add(sha);
  return sha;
}

export function readBlobJson<T>(sha: string): T {
  const sharded = blobPath(sha);
  const file = existsSync(sharded) ? sharded : join(BLOBS_DIR, `${sha}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export function resetBlobCache(): void {
  knownBlobShas.clear();
  knownShardDirs.clear();
  blobDirsEnsured = false;
}

function ensureBlobDirs(): void {
  if (!blobDirsEnsured) {
    ensureAtlDirs();
    blobDirsEnsured = true;
  }
}

function isAlreadyExistsError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EEXIST");
}

function blobPath(sha: string): string {
  const shard = sha.slice(0, 2);
  const dir = join(BLOBS_DIR, shard);
  if (!knownShardDirs.has(dir)) {
    mkdirSync(dir, { recursive: true });
    knownShardDirs.add(dir);
  }
  return join(dir, `${sha}.json`);
}
