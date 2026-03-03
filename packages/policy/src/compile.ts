import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

export interface CompileRegoOptions {
  entrypoint: string;
}

export function compileRegoToWasm(regoSource: string, options: CompileRegoOptions): Uint8Array {
  const workdir = mkdtempSync(join(tmpdir(), "branchlab-rego-"));
  const regoPath = join(workdir, "policy.rego");
  const bundlePath = join(workdir, "bundle.tar.gz");
  const wasmPath = join(workdir, "policy.wasm");

  try {
    writeFileSync(regoPath, regoSource, "utf8");

    execFileSync("opa", ["build", "-t", "wasm", "-e", options.entrypoint, regoPath, "-o", bundlePath], {
      stdio: "pipe",
    });

    execFileSync("tar", ["-xzf", bundlePath, "-C", workdir, "/policy.wasm"], {
      stdio: "pipe",
    });

    return new Uint8Array(readFileSync(wasmPath));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to compile Rego to WASM. Ensure 'opa' and 'tar' are installed. ${message}`);
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
}
