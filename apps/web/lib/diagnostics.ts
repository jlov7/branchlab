import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { writeFileAtomic } from "./fsAtomic";
import { newId } from "./ids";
import { listJobs } from "./jobs";
import { DIAGNOSTICS_DIR } from "./paths";
import { listProviders, getSettings } from "./settings";
import { listRuns } from "./runsRepo";

export interface DiagnosticsBundle {
  id: string;
  folder: string;
  file: string;
  createdAt: string;
}

export function createDiagnosticsBundle(): DiagnosticsBundle {
  const id = newId("diag");
  const createdAt = new Date().toISOString();
  const folder = join(DIAGNOSTICS_DIR, id);
  mkdirSync(folder, { recursive: true });

  const payload = {
    id,
    createdAt,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    settings: getSettings(),
    providers: listProviders().map((provider) => ({
      id: provider.id,
      name: provider.name,
      kind: provider.kind,
      baseUrl: provider.baseUrl,
      model: provider.model,
      enabled: provider.enabled,
      apiKeyEnv: provider.apiKeyEnv,
      hasApiKey: Boolean(process.env[provider.apiKeyEnv]),
    })),
    runs: {
      count: listRuns({ limit: 10_000 }).length,
      recent: listRuns({ limit: 20 }),
    },
    jobs: listJobs(50),
  };

  const file = join(folder, "diagnostics.json");
  writeFileAtomic(file, JSON.stringify(payload, null, 2));

  return {
    id,
    folder,
    file,
    createdAt,
  };
}
