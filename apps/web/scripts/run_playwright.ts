import { createServer } from "node:net";
import { spawn } from "node:child_process";

async function findOpenPort(start = 3000, end = 3999): Promise<number> {
  for (let port = start; port <= end; port += 1) {
    const open = await canBind(port);
    if (open) {
      return port;
    }
  }
  throw new Error(`No open port found between ${start} and ${end}`);
}

function canBind(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function run(): Promise<void> {
  const preferred = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
  const port = await findOpenPort(preferred, preferred + 100);
  const baseUrl = `http://127.0.0.1:${port}`;

  process.stdout.write(`playwright:port=${port}\n`);
  const args = ["exec", "playwright", "test", ...process.argv.slice(2)];

  const child = spawn("pnpm", args, {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      PLAYWRIGHT_BASE_URL: baseUrl,
    },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

void run();
