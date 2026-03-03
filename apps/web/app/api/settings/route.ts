import type { ProviderConfig } from "@branchlab/core";
import { badRequest, ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";
import { getSettings, listProviders, saveProviders, updateSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    return ok({
      settings: getSettings(),
      providers: listProviders(),
    });
  } catch (error) {
    return serverError("Failed to load settings", error);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      settings?: {
        redactionDefault?: boolean;
        activeProviderId?: string | null;
        reexecMaxCalls?: number;
        reexecMaxTokens?: number;
        reexecMaxCostUsd?: number;
        liveToolAllowlist?: string[];
        diagnosticsOptIn?: boolean;
        savedRunViews?: Array<{
          id: string;
          name: string;
          search: string;
          status: "all" | "success" | "fail" | "unknown";
        }>;
        savedComparePresets?: Array<{
          id: string;
          name: string;
          parentRunId: string;
          branchRunId: string;
        }>;
      };
      providers?: ProviderConfig[];
    };

    if (!body.settings && !body.providers) {
      return badRequest("Expected settings and/or providers payload");
    }

    const { settings, providers } = await withLock("settings:update", async () => ({
      settings: body.settings ? updateSettings(body.settings) : getSettings(),
      providers: body.providers ? saveProviders(body.providers) : listProviders(),
    }));

    return ok({ settings, providers });
  } catch (error) {
    return serverError("Failed to save settings", error);
  }
}
