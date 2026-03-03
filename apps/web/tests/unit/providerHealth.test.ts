import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkProviderHealth } from "@/lib/providerHealth";
import { resetAllData } from "@/lib/runsRepo";

describe("provider health", () => {
  beforeEach(() => {
    resetAllData();
  });

  it("reports warnings when providers are disabled or missing keys", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const health = await checkProviderHealth();
    expect(health.length).toBeGreaterThan(0);
    expect(health.some((item) => item.status === "warn")).toBe(true);

    vi.unstubAllGlobals();
  });
});
