import { describe, expect, it } from "vitest";
import { buildCsp } from "../../next.config";

describe("buildCsp", () => {
  it("includes stricter production directives", () => {
    const csp = buildCsp("production");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("ws://localhost");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("includes local websocket allowances in development", () => {
    const csp = buildCsp("development");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws://localhost:*");
    expect(csp).toContain("http://127.0.0.1:*");
  });
});
