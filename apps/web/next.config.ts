import type { NextConfig } from "next";
import { resolve } from "node:path";

export function buildCsp(nodeEnv = process.env.NODE_ENV): string {
  const isDev = nodeEnv !== "production";
  const connectSources = ["'self'", "https://api.openai.com", "https://api.anthropic.com"];
  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (isDev) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("ws://localhost:*", "ws://127.0.0.1:*", "http://localhost:*", "http://127.0.0.1:*");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const nextConfig: NextConfig = {
  transpilePackages: ["@branchlab/core", "@branchlab/policy", "@branchlab/sdk"],
  outputFileTracingRoot: resolve(process.cwd(), "../.."),
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp() },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
