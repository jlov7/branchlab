import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", ".turbo", ".atl", "node_modules", "playwright-report", "test-results"]);
const externalSchemes = /^(?:https?:|mailto:|tel:|#)/i;

interface BrokenLink {
  file: string;
  link: string;
}

function walk(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      files.push(absolutePath);
    }
  }

  return files;
}

function extractLinks(markdown: string): string[] {
  const links: string[] = [];
  const markdownWithoutCode = markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]+`/g, "");
  const markdownLinkPattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  const htmlLinkPattern = /\b(?:href|src)=["']([^"']+)["']/g;

  for (const match of markdownWithoutCode.matchAll(markdownLinkPattern)) {
    links.push(match[1] ?? "");
  }

  for (const match of markdownWithoutCode.matchAll(htmlLinkPattern)) {
    links.push(match[1] ?? "");
  }

  return links;
}

function stripFragmentAndQuery(link: string): string {
  return link.split("#", 1)[0]?.split("?", 1)[0] ?? "";
}

function linkExists(markdownFile: string, link: string): boolean {
  if (!link || externalSchemes.test(link)) {
    return true;
  }

  const target = stripFragmentAndQuery(decodeURIComponent(link));
  if (!target) {
    return true;
  }

  const absoluteTarget = target.startsWith("/")
    ? resolve(root, `.${target}`)
    : resolve(dirname(markdownFile), target);

  const relativeTarget = relative(root, absoluteTarget);
  if (relativeTarget.startsWith("..") || relativeTarget === "") {
    return false;
  }

  return existsSync(absoluteTarget) && statSync(absoluteTarget).isFile();
}

const brokenLinks: BrokenLink[] = [];
const markdownFiles = walk(root);
for (const markdownFile of markdownFiles) {
  const markdown = readFileSync(markdownFile, "utf8");
  for (const link of extractLinks(markdown)) {
    if (!linkExists(markdownFile, link)) {
      brokenLinks.push({ file: markdownFile.replace(`${root}/`, ""), link });
    }
  }
}

if (brokenLinks.length > 0) {
  for (const broken of brokenLinks) {
    console.error(`${broken.file}: broken local link ${broken.link}`);
  }
  process.exit(1);
}

console.log(`markdown links ok (${markdownFiles.length} files)`);
