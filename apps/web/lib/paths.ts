import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

export const DEFAULT_REPO_ROOT = resolve(process.cwd(), "../..");
export const DEFAULT_ATL_DIR = join(DEFAULT_REPO_ROOT, ".atl");
export const REPO_ROOT = DEFAULT_REPO_ROOT;
export const DATA_ROOT = process.env.BRANCHLAB_ROOT ? resolve(process.env.BRANCHLAB_ROOT) : DEFAULT_REPO_ROOT;
export const ATL_DIR = join(DATA_ROOT, ".atl");
export const BLOBS_DIR = join(ATL_DIR, "blobs");
export const EXPORTS_DIR = join(ATL_DIR, "exports");
export const DIAGNOSTICS_DIR = join(ATL_DIR, "diagnostics");
export const DB_PATH = join(ATL_DIR, "branchlab.sqlite");

export function ensureAtlDirs(): void {
  mkdirSync(ATL_DIR, { recursive: true });
  mkdirSync(BLOBS_DIR, { recursive: true });
  mkdirSync(EXPORTS_DIR, { recursive: true });
  mkdirSync(DIAGNOSTICS_DIR, { recursive: true });
}
