import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertSafeDataReset } from "@/lib/dataSafety";

describe("data reset safety", () => {
  it("blocks default .atl deletion without explicit app-runtime opt-in", () => {
    expect(() =>
      assertSafeDataReset({
        targetDir: "/repo/.atl",
        defaultDataDir: "/repo/.atl",
      }),
    ).toThrow(/explicit app-runtime opt-in/);
  });

  it("allows isolated test roots", () => {
    const root = join(tmpdir(), "branchlab-test-root");
    expect(() =>
      assertSafeDataReset({
        targetDir: join(root, ".atl"),
        defaultDataDir: "/repo/.atl",
        customRoot: root,
      }),
    ).not.toThrow();
  });

  it("blocks custom roots from deleting outside their .atl directory", () => {
    const root = join(tmpdir(), "branchlab-test-root");
    expect(() =>
      assertSafeDataReset({
        targetDir: join(tmpdir(), "other-atl"),
        defaultDataDir: "/repo/.atl",
        customRoot: root,
      }),
    ).toThrow(/outside BRANCHLAB_ROOT/);
  });
});
