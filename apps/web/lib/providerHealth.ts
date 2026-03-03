import { listProviders } from "./settings";

export interface ProviderHealth {
  providerId: string;
  enabled: boolean;
  hasApiKey: boolean;
  reachable: boolean;
  status: "ok" | "warn" | "error";
  detail: string;
}

export async function checkProviderHealth(): Promise<ProviderHealth[]> {
  const providers = listProviders();

  const checks = providers.map(async (provider): Promise<ProviderHealth> => {
    const hasApiKey = Boolean(process.env[provider.apiKeyEnv]);
    if (!provider.enabled) {
      return {
        providerId: provider.id,
        enabled: false,
        hasApiKey,
        reachable: false,
        status: "warn",
        detail: "Provider disabled",
      };
    }

    const reachable = await probe(provider.baseUrl);
    if (!hasApiKey) {
      return {
        providerId: provider.id,
        enabled: true,
        hasApiKey: false,
        reachable,
        status: "warn",
        detail: `Missing env var ${provider.apiKeyEnv}`,
      };
    }

    return {
      providerId: provider.id,
      enabled: true,
      hasApiKey: true,
      reachable,
      status: reachable ? "ok" : "error",
      detail: reachable ? "Reachable and key configured" : "Endpoint not reachable",
    };
  });

  return Promise.all(checks);
}

async function probe(baseUrl: string): Promise<boolean> {
  try {
    const timeout = AbortSignal.timeout(3000);
    const response = await fetch(baseUrl, { method: "GET", signal: timeout });
    return response.status < 500;
  } catch {
    return false;
  }
}
