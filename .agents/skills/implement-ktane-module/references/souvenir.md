# Souvenir compatibility

Use this reference only when the module catalog does not mark the module `NotACandidate`.

1. Check the current Souvenir manual, `SouvenirData.js`, KtaneSouvenir source, and the module handler. Verify display name, module ID, and every question family.
2. For each family, determine how the correct answer is derived, including stages, positions, subsets, exclusions, transformations, successful versus reset attempts, the actual solution versus candidates, and visual/audio identity.
3. Compare those requirements with local module state, solution storage, `SouvenirSolver`, and the frontend question picker. Add no speculative state when no upstream handler exists.
4. Persist every askable fact before mutation or reset, including histories, final solution, and last successful attempt. Store the canonical observed value or transform it explicitly at the Souvenir boundary.
5. Add explicit backend resolution for positional, negative-membership, reset-sensitive, transformed, derived, visual, or audio answers; do not rely on generic state flattening.
6. Add one frontend option per upstream question family. Parameterized families must capture their stage, position, wire, color, or other argument. Returned answers must match player-visible choices rather than internal objects, enums, glyph names, or excluded candidates.
7. Test every family through the direct-answer path used by the frontend, including at least one transformed, excluded, or reset-sensitive case when applicable.

Do not claim Souvenir compatibility until a solved local module can answer every upstream family without asking the user to remember discarded state or a solution already entered.
