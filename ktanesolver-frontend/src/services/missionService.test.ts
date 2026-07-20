import { describe, expect, it } from "vitest";
import type { ModuleCatalogItem } from "../types";
import { resolveMissionBomb } from "./missionService";

const catalog = [
    {id: "memory", type: "MEMORY"},
    {id: "forgetmenot", type: "FORGET_ME_NOT"},
] as ModuleCatalogItem[];

describe("resolveMissionBomb", () => {
    it("imports Morse-A-Maze by its game module ID", () => {
        expect(resolveMissionBomb({
            modules: 1,
            strikes: 3,
            time: 300,
            widgets: 5,
            pools: [{count: 1, modules: ["MorseAMaze"]}],
        }, catalog).modules).toEqual({MORSE_A_MAZE: 1});
    });

    it("imports Fast Math by its game module ID", () => {
        expect(resolveMissionBomb({
            modules: 1,
            strikes: 3,
            time: 300,
            widgets: 5,
            pools: [{count: 1, modules: ["fastMath"]}],
        }, catalog).modules).toEqual({FAST_MATH: 1});
    });

    it("imports fixed supported pools and reports unresolved slots", () => {
        expect(resolveMissionBomb({
            modules: 6,
            strikes: 3,
            time: 300,
            widgets: 5,
            pools: [
                {count: 2, modules: ["Memory"]},
                {count: 1, modules: ["MemoryV2"]},
                {count: 2, modules: ["Memory", "MemoryV2"]},
                {count: 1, modules: ["ALL_SOLVABLE"]},
            ],
        }, catalog)).toEqual({
            modules: {MEMORY: 2, FORGET_ME_NOT: 1},
            importedCount: 3,
            randomCount: 2,
            unresolvedCount: 1,
        });
    });
});
