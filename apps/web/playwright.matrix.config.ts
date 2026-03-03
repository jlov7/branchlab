import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const port = Number(new URL(baseURL).port || "3000");

export default defineConfig({
  testDir: "./tests/e2e",
  retries: 0,
  workers: 1,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    },
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    port,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
