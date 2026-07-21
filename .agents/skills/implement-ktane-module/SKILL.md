---
name: implement-ktane-module
description: Implement and document a complete, Souvenir-compatible KTaNE module solver in the KTANESolver Spring Boot and React/TypeScript project from a ktane.timwi.de manual URL, then test, restart, and health-check the changes. Use when the user sends a KTaNE HTML/PDF manual link—alone or with a short request—and wants the backend and frontend implementation, or asks to add a module from the KTaNE manual repository.
---

# Implement KTaNE Module

Turn the supplied manual into a working end-to-end solver without requiring the user to restate this workflow.

## Workflow

1. Read the repository `AGENTS.md` and inspect the current worktree. Preserve unrelated user changes.
2. Open the supplied manual URL and extract every rule, input, output, multi-stage behavior, and edgework dependency. For graphical flowcharts or ambiguous rules, inspect the original module source in the `KtaneModules` GitHub organization when available. Treat the manual as authoritative and use source code only to disambiguate its encoding. Separately verify the Twitch Plays grammar against the built-in handler in `KtaneTwitchPlays` or the module's own `ProcessTwitchCommand`: record its exact verbs, argument format, indexing, sequencing, and any stage-dependent limitations.
3. Open the current [Souvenir manual](https://ktane.timwi.de/HTML/Souvenir.html), then verify the module display name, ID, and question summary against its [manual data](https://ktane.timwi.de/HTML/js/Modules/SouvenirData.js) and the [original Souvenir source](https://github.com/Timwi/KtaneSouvenir). Read the module's handler, not just its question enum: record every question family and exactly how its correct-answer set is derived. Include successful-run versus struck/reset attempts, initial/final/stage values, internal values versus operator-entered or transformed values, excluded/negative-membership choices, the actual solution versus other candidates, and visual/audio answer identity. Compare each family with the local module state, solution, `SouvenirSolver`, and frontend question picker; do not assume generic recorded-fact matching handles positional or derived facts. If no handler exists upstream, add no speculative Souvenir state.
4. Trace one comparable existing module from frontend component through service and generic solve endpoint to solver and tests. Reuse current helpers and UI components.
5. Implement the smallest complete slice:
   - add the backend and frontend `ModuleType` values;
   - create input, output, and annotated solver classes under the correct module package;
   - use `BombEntity` helpers for serial number, ports, indicators, and batteries;
   - validate user-controlled input and persist input/state using the existing solver helpers;
   - when Souvenir supports the module, persist every fact it can ask before mutation or reset, including histories, the final solution, and the last successful attempt; store the canonical value Souvenir observes, or explicitly transform operator-entered values at the Souvenir boundary; add explicit `SouvenirSolver` resolution for stages, positions, subsets, exclusions, derived answers, and any case where generic recorded-fact matching is not exact;
   - create the frontend API service and solver component;
   - register the lazy-loaded component;
   - add its result-based command to the shared `generateTwitchCommand` switch and classify it as `verified` or `conditional` in `TWITCH_COMMAND_SUPPORT`; generate only commands accepted by the authoritative Twitch parser, and return no command when the solver lacks enough interaction state to act safely;
   - provide accessible controls and a clear visual result. Use inline SVG/CSS for simple module-native shapes; add no dependency for this.
6. If Souvenir supports the module, add one frontend question option per upstream question family. Parameterized families must capture the named stage, position, wire, color, or other argument with specific options/selectors, or accept the exact question and its displayed choices; one aggregate preset is not sufficient. A direct answer must be actionable against Souvenir's displayed choices: never return a raw object, an unlabeled aggregate, all candidates when the question excludes the solution, or internal enum/glyph names when a player-facing label or image exists. Add or extend a focused Souvenir test for every family through the same direct-answer path used by the frontend, including at least one transformed, excluded, or reset-sensitive answer when applicable.
7. Add one focused backend test covering the non-trivial algorithm and important edgework branches. Add the module to the exhaustive fixture in `src/utils/twitchCommands.test.ts`, asserting the complete generated command string from a representative solver result. For a conditional command, also assert that missing or unsafe interaction data returns an empty string. Add other frontend tests only when the component introduces behavior not already covered by the standard solver pattern.
8. Run the focused backend test, relevant Souvenir tests, `npm test -- --run src/utils/twitchCommands.test.ts`, and `npm run build`. Fix failures before continuing.
9. Restart only the processes listening on backend port `8080` and frontend port `5173`. Confirm their command lines belong to this workspace before stopping them. Start backend with `gradlew.bat bootRun` and frontend with `npm run dev -- --host 127.0.0.1`, using hidden background windows.
10. Wait up to 60 seconds for both ports. Request `http://127.0.0.1:8080/api/modules` and verify the new module is present; request `http://127.0.0.1:5173` and verify HTTP 200.
11. With the healthy backend still running, run `node scripts/generate-supported-modules.mjs`. Verify `docs/supported-modules.md` contains the new module type, then run `git diff --check`. Do not edit the generated table by hand. Update another maintained GitBook page only when the module changes a documented user workflow, API contract, shared concept, or contributor rule; add no one-page-per-module documentation by default.
12. Leave the verified changes uncommitted for the user to review.

## Guardrails

- Do not add a controller or database migration: module discovery and the generic solve endpoint already cover new solvers.
- Do not duplicate edgework fields in the module input when `BombEntity` already stores them.
- Do not rely on generic state flattening for Souvenir questions with positional, negative-membership, last-successful-attempt, reset, visual, or audio semantics; encode and test them explicitly.
- Do not mark a module Souvenir-compatible until each upstream handler question can be selected in the frontend and resolved from a solved local module without asking the user to remember discarded state or the solution they already entered.
- Do not guess unreadable flowchart transitions. Resolve them from the manual SVG or original module source and preserve the manual's exact first/priority semantics.
- Do not infer Twitch commands from the manual's solve instructions or emit prose/placeholder commands. Verify the exact command against `KtaneTwitchPlays` or `ProcessTwitchCommand`, including whether positions are zero- or one-based and whether multi-step actions require separate commands.
- Do not leave `docs/supported-modules.md` stale after adding a registered solver, and do not hand-maintain data already produced by its generator.
- Do not overwrite or revert unrelated worktree changes.
- If PostgreSQL or another required external service prevents backend startup, leave the implementation and tests complete and report the precise blocker.
- Finish with a concise report naming verification results and live ports.
