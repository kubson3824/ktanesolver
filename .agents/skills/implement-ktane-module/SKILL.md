---
name: implement-ktane-module
description: Implement and document a complete KTaNE module solver in the KTANESolver Spring Boot and React/TypeScript project from a ktane.timwi.de manual URL, including verified Twitch commands, conditional Souvenir support, focused tests, restart, and health checks. Use when the user supplies a KTaNE HTML/PDF manual or asks to add a module from the KTaNE manual repository.
---

# Implement KTaNE Module

Build the smallest complete backend/frontend solver and leave it uncommitted.

## Workflow

1. Use the repository `AGENTS.md` already in context; read it only when it was not provided. Check `git status --short` and preserve unrelated changes.
2. Run:

   ```powershell
   node <skill-dir>/scripts/collect-module-context.mjs <manual-url>
   ```

   The command prints a compact summary and saves full manual tables and source text outside the conversation. Read only the returned file/ranges needed to resolve rules or Twitch behavior.
3. Record the rules, inputs, outputs, stages, edgework, canonical `ModuleID`, Twitch grammar, and Souvenir status. Treat the manual as authoritative; use source only for ambiguous encoding and the exact Twitch parser.
4. If Souvenir is `NotACandidate`, skip all Souvenir work. Otherwise read [references/souvenir.md](references/souvenir.md) completely and follow it.
5. Inspect one comparable local solver path and only the shared registry/test sections being edited.
6. Implement:
   - backend/frontend `ModuleType`;
   - input, output, annotated solver, frontend service, accessible solver component, and lazy registry entry;
   - canonical mission mapping/test only when `@ModuleInfo.id` differs from `ModuleID`;
   - validated input and required persisted state;
   - a result-derived Twitch command accepted by the upstream parser, classified as `verified` or `conditional`;
   - one focused backend test and the exhaustive Twitch fixture.
7. Run the compact verifier:

   ```powershell
   node <skill-dir>/scripts/verify-module.mjs `
     --backend-test <fully-qualified-test-class> `
     --module-type <ENUM_VALUE> `
     --module-id <canonical-module-id>
   ```

   It runs focused tests and the production build. When this workspace's Compose stack is available, it stops only the backend/frontend services, refuses unrelated port owners, rebuilds the images, and leaves the healthy stack running. Otherwise it falls back to workspace-owned Gradle/Vite processes. It then checks both endpoints, regenerates supported-module docs, and runs `git diff --check`. On success it emits only a compact summary; on failure it emits the relevant local or Compose log tail.
8. Leave changes uncommitted and report verification plus live ports.

## Guardrails

- Add no controller, migration, dependency, or duplicate bomb edgework.
- Do not load raw catalogs, whole manuals, full source files, Java classpaths, Vite asset tables, or broad repository listings into context.
- Do not guess graphical transitions or Twitch syntax.
- Do not hand-edit generated supported-module documentation.
- Add frontend tests only for behavior outside the standard solver pattern.
- Keep Graphify and other repository-wide maintenance outside this skill.
