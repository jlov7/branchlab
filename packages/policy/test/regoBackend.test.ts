import { describe, expect, it } from "vitest";
import { compileRegoToWasm } from "../src/compile";

describe("rego compile", () => {
  it("returns useful error when opa is unavailable", () => {
    const src = `package branchlab\ndefault allow := true`;
    expect(() => compileRegoToWasm(src, { entrypoint: "branchlab/allow" })).toThrowError(
      /Failed to compile Rego to WASM/,
    );
  });
});
