import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { writeFileAtomic } from "./fsAtomic";
import { BLOBS_DIR, ensureAtlDirs } from "./paths";

export function writeBlobJson(value: unknown): string {
  ensureAtlDirs();
  const json = JSON.stringify(value);
  const sha = createHash("sha256").update(json).digest("hex");
  const target = join(BLOBS_DIR, `${sha}.json`);

  if (!existsSync(target)) {
    writeFileAtomic(target, `${json}\n`);
  }

  return sha;
}

export function readBlobJson<T>(sha: string): T {
  const file = join(BLOBS_DIR, `${sha}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}
