import { describe, expect, it } from "vitest";
import { withLock } from "@/lib/lock";

describe("withLock", () => {
  it("serializes work for the same lock key", async () => {
    const order: string[] = [];

    await Promise.all([
      withLock("shared", async () => {
        order.push("a:start");
        await new Promise((resolve) => setTimeout(resolve, 25));
        order.push("a:end");
      }),
      withLock("shared", async () => {
        order.push("b:start");
        order.push("b:end");
      }),
    ]);

    expect(order).toEqual(["a:start", "a:end", "b:start", "b:end"]);
  });

  it("allows parallel work for different lock keys", async () => {
    const starts: string[] = [];

    await Promise.all([
      withLock("x", async () => {
        starts.push("x");
      }),
      withLock("y", async () => {
        starts.push("y");
      }),
    ]);

    expect(starts.sort()).toEqual(["x", "y"]);
  });
});
