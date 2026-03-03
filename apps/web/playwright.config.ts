import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const port = Number(new URL(baseURL).port || "3000");

export default defineConfig({
  testDir: "./tests/e2e",
  retries: 1,
  workers: 1,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    port,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
