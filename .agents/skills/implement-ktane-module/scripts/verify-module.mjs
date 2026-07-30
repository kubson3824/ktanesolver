#!/usr/bin/env node

import { closeSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const backendTest = value("--backend-test");
const moduleType = value("--module-type");
const moduleId = value("--module-id");
if (!backendTest || !moduleType || !moduleId) {
  console.error("Usage: node verify-module.mjs --backend-test <class> --module-type <type> --module-id <id>");
  process.exit(2);
}
if (!/^[A-Za-z0-9_.$]+$/.test(backendTest) || !/^[A-Z0-9_]+$/.test(moduleType)) {
  throw new Error("Invalid backend test or module type");
}

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = resolve(skillDir, "../../..");
const frontend = join(workspace, "ktanesolver-frontend");
const logDir = join(tmpdir(), `ktanesolver-verify-${process.pid}-${Date.now()}`);
mkdirSync(logDir, { recursive: true });

const tail = (text, lines = 80) => text.trimEnd().split(/\r?\n/).slice(-lines).join("\n");
const run = (label, command, cwd) => {
  const result = spawnSync("cmd.exe", ["/d", "/s", "/c", command], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${tail(`${result.stdout}\n${result.stderr}`)}`);
  }
};

const findCompose = () =>
  ["docker compose", "docker-compose"].find((command) => {
    const result = spawnSync("cmd.exe", ["/d", "/s", "/c", `${command} ps -q`], {
      cwd: workspace,
      windowsHide: true,
      stdio: "ignore",
    });
    return result.status === 0;
  });

const powershell = (script) => {
  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", script], {
    cwd: workspace,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, KTANE_WORKSPACE: workspace },
  });
  if (result.status !== 0) throw new Error(tail(`${result.stdout}\n${result.stderr}`));
  return result.stdout.trim();
};

const listenerScript = String.raw`
$items = foreach ($port in 8080,5173) {
  $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($connection) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
    [pscustomobject]@{
      port = $port
      pid = $connection.OwningProcess
      executable = $process.Name
      workspace = $process.CommandLine -like "*$env:KTANE_WORKSPACE*"
    }
  }
}
@($items) | ConvertTo-Json -Compress
`;
const listeners = () => {
  const output = powershell(listenerScript);
  if (!output) return [];
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
};

const stopWorkspaceListeners = () => {
  const current = listeners();
  const outside = current.find((listener) => !listener.workspace);
  if (outside) {
    throw new Error(`Port ${outside.port} belongs to PID ${outside.pid} (${outside.executable}), outside this workspace`);
  }
  if (current.length) {
    powershell(`Stop-Process -Id ${current.map(({ pid }) => pid).join(",")}`);
  }
};

const startDetached = (command, cwd, name) => {
  const stdout = openSync(join(logDir, `${name}.out.log`), "w");
  const stderr = openSync(join(logDir, `${name}.err.log`), "w");
  const child = spawn("cmd.exe", ["/d", "/s", "/c", command], {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", stdout, stderr],
  });
  child.unref();
  closeSync(stdout);
  closeSync(stderr);
};

const localLogs = () =>
  ["backend.err.log", "backend.out.log", "frontend.err.log", "frontend.out.log"]
    .map((name) => {
      try {
        return `${name}:\n${tail(readFileSync(join(logDir, name), "utf8"), 60)}`;
      } catch {
        return `${name}: (no output)`;
      }
    })
    .join("\n");

const composeLogs = (compose) => {
  const result = spawnSync("cmd.exe", ["/d", "/s", "/c", `${compose} logs --tail 60 backend frontend`], {
    cwd: workspace,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  return tail(`${result.stdout}\n${result.stderr}`, 120);
};

const waitForServers = async (failureLogs) => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const [modulesResponse, frontendResponse] = await Promise.all([
        fetch("http://127.0.0.1:8080/api/modules"),
        fetch("http://127.0.0.1:5173"),
      ]);
      if (modulesResponse.ok && frontendResponse.ok) return { modulesResponse, frontendResponse };
    } catch {
      // Servers are still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }
  throw new Error(`Servers did not start:\n${failureLogs()}`);
};

run("backend test", `.\\gradlew.bat test --tests ${backendTest}`, workspace);
run(
  "frontend tests",
  "npm.cmd test -- --run src/services/missionService.test.ts src/utils/twitchCommands.test.ts",
  frontend,
);
run("frontend build", "npm.cmd run build", frontend);

const compose = findCompose();
if (compose) run("stop Compose application", `${compose} stop backend frontend`, workspace);
stopWorkspaceListeners();
if (compose) {
  run("Compose build and restart", `${compose} up --build -d`, workspace);
} else {
  startDetached(".\\gradlew.bat bootRun", workspace, "backend");
  startDetached("npm.cmd run dev -- --host 127.0.0.1", frontend, "frontend");
}
const { modulesResponse, frontendResponse } = await waitForServers(
  compose ? () => composeLogs(compose) : localLogs,
);
const activeListeners = listeners();

const modules = await modulesResponse.json();
const catalog = modules.some((entry) => entry.type === moduleType && entry.id === moduleId);
if (!catalog) throw new Error(`Catalog does not contain ${moduleType} with id ${moduleId}`);

run("supported-module docs", "node scripts/generate-supported-modules.mjs", workspace);
if (!readFileSync(join(workspace, "docs/supported-modules.md"), "utf8").includes(moduleType)) {
  throw new Error(`Generated supported-module docs do not contain ${moduleType}`);
}
run("git diff check", "git diff --check", workspace);

const listener = (port) => activeListeners.find((entry) => entry.port === port);
console.log(JSON.stringify({
  moduleType,
  moduleId,
  backend: { port: 8080, pid: listener(8080)?.pid, healthy: true },
  frontend: { port: 5173, pid: listener(5173)?.pid, status: frontendResponse.status },
  runtime: compose ? "compose" : "local",
  catalog,
  docs: true,
}));
