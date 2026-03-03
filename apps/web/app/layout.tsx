import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "BranchLab",
  description: "Replay and fork agent runs locally with deterministic evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} ${monoFont.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
