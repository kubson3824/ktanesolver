---
name: implement-ktane-module
description: Implement a complete, Souvenir-compatible KTaNE module solver in the KTANESolver Spring Boot and React/TypeScript project from a ktane.timwi.de manual URL, then test, restart, and health-check both development servers. Use when the user sends a KTaNE HTML/PDF manual link—alone or with a short request—and wants the backend and frontend implementation, or asks to add a module from the KTaNE manual repository.
---

# Implement KTaNE Module

Turn the supplied manual into a working end-to-end solver without requiring the user to restate this workflow.

## Workflow

1. Read the repository `AGENTS.md` and inspect the current worktree. Preserve unrelated user changes.
2. Open the supplied manual URL and extract every rule, input, output, multi-stage behavior, and edgework dependency. For graphical flowcharts or ambiguous rules, inspect the original module source in the `KtaneModules` GitHub organization when available. Treat the manual as authoritative and use source code only to disambiguate its encoding.
3. Open the current [Souvenir manual](https://ktane.timwi.de/HTML/Souvenir.html), then verify the module display name, ID, and question summary against its [manual data](https://ktane.timwi.de/HTML/js/Modules/SouvenirData.js) and the [original Souvenir source](https://github.com/KtaneModules/KtaneSouvenir-Timwi). Record every question family and its exact successful-run, initial, stage, strike/reset, and visual/audio answer semantics. Compare each family with the local module state and `SouvenirSolver`; do not assume the generic fallback handles positional or derived facts. If no handler exists upstream, add no speculative Souvenir state.
4. Trace one comparable existing module from frontend component through service and generic solve endpoint to solver and tests. Reuse current helpers and UI components.
5. Implement the smallest complete slice:
   - add the backend and frontend `ModuleType` values;
   - create input, output, and annotated solver classes under the correct module package;
   - use `BombEntity` helpers for serial number, ports, indicators, and batteries;
   - validate user-controlled input and persist input/state using the existing solver helpers;
   - when Souvenir supports the module, persist every fact it can ask before mutation or reset, including histories and the last successful attempt, and add explicit `SouvenirSolver` resolution wherever generic recorded-fact matching is not exact; use stable canonical values for visual/audio answers;
   - create the frontend API service and solver component;
   - register the lazy-loaded component;
   - provide accessible controls and a clear visual result. Use inline SVG/CSS for simple module-native shapes; add no dependency for this.
6. If Souvenir supports the module, add or extend a focused Souvenir test for every question family. Ensure its UI presents visual/audio targets in a recognizable form instead of exposing internal glyph codes or requiring the user to guess asset names.
7. Add one focused backend test covering the non-trivial algorithm and important edgework branches. Add frontend tests only when the component introduces behavior not already covered by the standard solver pattern.
8. Run the focused backend test, relevant Souvenir tests, `npm run build`, and `git diff --check`. Fix failures before continuing.
9. Restart only the processes listening on backend port `8080` and frontend port `5173`. Confirm their command lines belong to this workspace before stopping them. Start backend with `gradlew.bat bootRun` and frontend with `npm run dev -- --host 127.0.0.1`, using hidden background windows.
10. Wait up to 60 seconds for both ports. Request `http://127.0.0.1:8080/api/modules` and verify the new module is present; request `http://127.0.0.1:5173` and verify HTTP 200.

## Guardrails

- Do not add a controller or database migration: module discovery and the generic solve endpoint already cover new solvers.
- Do not duplicate edgework fields in the module input when `BombEntity` already stores them.
- Do not rely on generic state flattening for Souvenir questions with positional, negative-membership, last-successful-attempt, reset, visual, or audio semantics; encode and test them explicitly.
- Do not guess unreadable flowchart transitions. Resolve them from the manual SVG or original module source and preserve the manual's exact first/priority semantics.
- Do not overwrite, revert, stage, or commit unrelated worktree changes.
- If PostgreSQL or another required external service prevents backend startup, leave the implementation and tests complete and report the precise blocker.
- Finish with a concise report naming verification results and live ports.
