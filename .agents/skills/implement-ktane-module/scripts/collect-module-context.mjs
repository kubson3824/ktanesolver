#!/usr/bin/env node

import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const args = process.argv.slice(2);
const input = args[0];
const outputArg = args.indexOf("--output");
if (!input) {
  console.error("Usage: node collect-module-context.mjs <ktane manual URL> [--output <directory>]");
  process.exit(2);
}

const suppliedUrl = new URL(input);
if (suppliedUrl.hostname !== "ktane.timwi.de") throw new Error("Expected a ktane.timwi.de manual URL");
const manualUrl = suppliedUrl.pathname.startsWith("/PDF/")
  ? new URL(`/HTML/${suppliedUrl.pathname.slice(5).replace(/\.pdf$/i, ".html")}`, suppliedUrl)
  : suppliedUrl;

const decode = (value) => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
  .replace(/&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
const text = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const fetchOk = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response;
};

const html = await (await fetchOk(manualUrl)).text();
const title = decode(html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1]
  ?? html.match(/<title>(.*?)\s+[—-]/i)?.[1]
  ?? "").trim();
const catalog = await (await fetchOk("https://ktane.timwi.de/json/raw")).json();
const module = catalog.KtaneModules?.find((entry) => entry.Name === title);
if (!module) throw new Error(`No catalog entry found for ${title || manualUrl.href}`);

const tableRows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  .map((match) => [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map((cell) => text(cell[1])))
  .filter((row) => row.length);
const prose = text(html
  .replace(/<script\b[\s\S]*?<\/script>/gi, "")
  .replace(/<style\b[\s\S]*?<\/style>/gi, "")
  .replace(/<table\b[\s\S]*?<\/table>/gi, "")
  .replace(/<br\s*\/?\s*>|<\/(?:p|li|ol|ul|h\d|div)>/gi, "\n"))
  .replace(/\s*\n\s*/g, "\n");
const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rules = prose
  .replace(new RegExp(`${escapedTitle}\\s+[—-]\\s+Keep Talking and Nobody Explodes Module`, "gi"), "")
  .replace(new RegExp(`Keep Talking and Nobody Explodes Mod\\s+${escapedTitle}`, "gi"), "")
  .replace(new RegExp(`On the Subject of\\s+${escapedTitle}`, "gi"), "")
  .replace(/(?:Countries Class, Journey Type, Seat & Price|Departure Cities|Destination Cities)\s+Page \d+ of \d+/gi, "")
  .replace(/\s+/g, " ")
  .trim();

let sourceCandidates = [];
let sourceFile;
let sourceUrl;
let sourceText;
let twitchLineRange;
const source = module.SourceUrl && new URL(module.SourceUrl);
if (source?.hostname === "github.com") {
  const [owner, repo] = source.pathname.split("/").filter(Boolean);
  const headers = { "User-Agent": "Codex-KTaNE-context" };
  const repoInfo = await (await fetchOk(`https://api.github.com/repos/${owner}/${repo}`, { headers })).json();
  if (repoInfo.default_branch) {
    const tree = await (await fetchOk(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`,
      { headers },
    )).json();
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    sourceCandidates = (tree.tree ?? [])
      .map((entry) => entry.path)
      .filter((path) => /\.cs$/i.test(path) && !/(?:Editor|TestHarness|Steamworks|Libs?|Plugins?)\//i.test(path))
      .sort((a, b) => Number(b.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key))
        - Number(a.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key)))
      .slice(0, 40);
    if (sourceCandidates[0]) {
      sourceFile = sourceCandidates[0];
      sourceUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${repoInfo.default_branch}/${
        sourceFile.split("/").map(encodeURIComponent).join("/")
      }`;
      sourceText = await (await fetchOk(sourceUrl, { headers })).text();
      const lines = sourceText.split(/\r?\n/);
      const twitchStart = lines.findIndex((line) => /TwitchHelpMessage|ProcessTwitchCommand/.test(line));
      if (twitchStart >= 0) {
        const forcedSolve = lines.findIndex((line, index) => index > twitchStart && /TwitchHandleForcedSolve/.test(line));
        twitchLineRange = [twitchStart + 1, Math.min(forcedSolve >= 0 ? forcedSolve : twitchStart + 120, lines.length)];
      }
    }
  }
}

const slug = module.ModuleID?.replace(/[^a-z0-9_-]/gi, "-") || "module";
const outputDir = outputArg >= 0 && args[outputArg + 1]
  ? resolve(args[outputArg + 1])
  : await mkdtemp(join(tmpdir(), `ktane-${slug}-`));
await mkdir(outputDir, { recursive: true });
const contextFile = join(outputDir, "context.json");
await writeFile(contextFile, JSON.stringify({
  manualUrl: manualUrl.href,
  module,
  manual: { prose, tableRows },
  sourceCandidates,
  source: sourceText ? { path: sourceFile, url: sourceUrl, text: sourceText } : null,
}, null, 2));

let savedSourceFile;
if (sourceText) {
  savedSourceFile = join(outputDir, basename(sourceFile));
  await writeFile(savedSourceFile, sourceText);
}

console.log(JSON.stringify({
  manualUrl: manualUrl.href,
  module: {
    name: module.Name,
    moduleId: module.ModuleID,
    type: module.Type,
    sourceUrl: module.SourceUrl,
    souvenir: module.Souvenir ?? null,
    twitchPlays: module.TwitchPlays ?? null,
  },
  manual: {
    rules,
    tableRowCount: tableRows.length,
    tablePreview: tableRows.slice(0, 8),
  },
  source: {
    candidates: sourceCandidates.slice(0, 8),
    file: savedSourceFile,
    twitchLineRange,
  },
  contextFile,
}, null, 2));
