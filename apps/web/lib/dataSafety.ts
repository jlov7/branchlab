import { homedir } from "node:os";
import { parse, resolve } from "node:path";

export interface ResetSafetyInput {
  targetDir: string;
  defaultDataDir: string;
  customRoot?: string;
  allowDefaultRoot?: boolean;
}

export function assertSafeDataReset(input: ResetSafetyInput): void {
  const target = resolve(input.targetDir);
  const defaultDataDir = resolve(input.defaultDataDir);
  const customRoot = input.customRoot ? resolve(input.customRoot) : undefined;
  const rootDir = parse(target).root;

  if (target === rootDir || target === resolve(homedir())) {
    throw new Error(`Refusing to delete unsafe data path: ${target}`);
  }

  if (!customRoot && !input.allowDefaultRoot) {
    throw new Error("Refusing to delete default BranchLab data without explicit app-runtime opt-in.");
  }

  if (target === defaultDataDir && !input.allowDefaultRoot) {
    throw new Error("Refusing to delete the default BranchLab .atl directory from tests or scripts.");
  }

  if (customRoot && target !== resolve(customRoot, ".atl")) {
    throw new Error(`Refusing to delete data path outside BRANCHLAB_ROOT: ${target}`);
  }
}
