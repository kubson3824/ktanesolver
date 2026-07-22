#!/usr/bin/env node

const input = process.argv[2];
if (!input) {
  console.error("Usage: node collect-module-context.mjs <ktane manual URL>");
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
const response = await fetch(manualUrl);
if (!response.ok) throw new Error(`Manual returned ${response.status}`);
const html = await response.text();
const title = decode(html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1]
  ?? html.match(/<title>(.*?)\s+[—-]/i)?.[1]
  ?? "").trim();

const catalogResponse = await fetch("https://ktane.timwi.de/json/raw");
if (!catalogResponse.ok) throw new Error(`Module catalog returned ${catalogResponse.status}`);
const catalog = await catalogResponse.json();
const module = catalog.KtaneModules?.find((entry) => entry.Name === title);
if (!module) throw new Error(`No catalog entry found for ${title || manualUrl.href}`);

const tableRows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  .map((match) => [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => text(cell[1])))
  .filter((row) => row.length);
const prose = text(html
  .replace(/<script\b[\s\S]*?<\/script>/gi, "")
  .replace(/<style\b[\s\S]*?<\/style>/gi, "")
  .replace(/<table\b[\s\S]*?<\/table>/gi, "")
  .replace(/<br\s*\/?\s*>|<\/(?:p|li|ol|ul|h\d|div)>/gi, "\n"))
  .replace(/\s*\n\s*/g, "\n");

let sourceCandidates = [];
const source = module.SourceUrl && new URL(module.SourceUrl);
if (source?.hostname === "github.com") {
  const [owner, repo] = source.pathname.split("/").filter(Boolean);
  const headers = { "User-Agent": "Codex-KTaNE-context" };
  const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }).then((result) => result.json());
  if (repoInfo.default_branch) {
    const tree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`, { headers }).then((result) => result.json());
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    sourceCandidates = (tree.tree ?? [])
      .map((entry) => entry.path)
      .filter((path) => /\.cs$/i.test(path) && !/(?:Editor|TestHarness|Steamworks|Libs?|Plugins?)\//i.test(path))
      .sort((a, b) => Number(b.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key))
        - Number(a.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key)))
      .slice(0, 40);
  }
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
  manual: { prose, tableRows },
  sourceCandidates,
}, null, 2));
