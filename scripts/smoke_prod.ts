import { spawn } from "node:child_process";

const PORT = 3010;
const BASE = `http://127.0.0.1:${PORT}`;

async function run(): Promise<void> {
  await exec("pnpm --filter @branchlab/web build");
  const server = spawn(
    "pnpm",
    ["--filter", "@branchlab/web", "exec", "next", "start", "-p", String(PORT)],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  try {
    await waitForServer(BASE, 45_000);
    await assertOk(`${BASE}/`);
    await assertOk(`${BASE}/runs`);
    await assertOk(`${BASE}/compare`);

    const seed = await fetch(`${BASE}/api/demo/seed`, { method: "POST" });
    if (!seed.ok) {
      throw new Error(`Seed failed with status ${seed.status}`);
    }

    await assertOk(`${BASE}/api/runs?limit=5`);
    process.stdout.write("smoke:prod:ok\n");
  } finally {
    server.kill("SIGTERM");
  }
}

function exec(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${code}): ${command}`));
      }
    });
  });
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // wait and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function assertOk(url: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Expected 2xx for ${url}, got ${response.status}`);
  }
}

void run();
