import { describe, expect, it } from "vitest";
import { type RoundSummary, PortType, RoundStatus } from "../../types";
import { EMPTY_CRITERIA, collectFilterOptions, filterRounds } from "./roundFilters";

function round(overrides: Partial<RoundSummary> & Pick<RoundSummary, "id">): RoundSummary {
    return {
        status: RoundStatus.COMPLETED,
        bombCount: 1,
        moduleCount: 0,
        bombs: [],
        ...overrides,
    };
}

const rounds: RoundSummary[] = [
    round({
        id: "aaaa-1111",
        status: RoundStatus.COMPLETED,
        bombs: [
            {
                serialNumber: "AB3XZ9",
                aaBatteryCount: 2,
                dBatteryCount: 1,
                indicators: { FRK: true, BOB: false },
                ports: [PortType.RJ45, PortType.PARALLEL],
                moduleTypes: ["WIRES", "WIRES", "THE_BUTTON"],
            },
        ],
    }),
    round({
        id: "bbbb-2222",
        status: RoundStatus.FAILED,
        bombs: [
            {
                serialNumber: "QW7PL2",
                aaBatteryCount: 0,
                dBatteryCount: 0,
                indicators: {},
                ports: [PortType.DVI],
                moduleTypes: ["MEMORY"],
            },
        ],
    }),
];

describe("filterRounds", () => {
    it("returns everything with empty criteria", () => {
        expect(filterRounds(rounds, EMPTY_CRITERIA, [])).toHaveLength(2);
    });

    it("matches search against serial, indicators, ports and module names", () => {
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, search: "ab3x" }, [])).toEqual([rounds[0]]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, search: "frk" }, [])).toEqual([rounds[0]]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, search: "dvi" }, [])).toEqual([rounds[1]]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, search: "memory" }, [])).toEqual([rounds[1]]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, search: "nothing" }, [])).toEqual([]);
    });

    it("filters by status", () => {
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, status: RoundStatus.FAILED }, [])).toEqual([
            rounds[1],
        ]);
    });

    it("requires all selected indicators, ports and modules", () => {
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, indicators: ["FRK", "BOB"] }, [])).toEqual([
            rounds[0],
        ]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, indicators: ["FRK", "CAR"] }, [])).toEqual([]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, ports: [PortType.RJ45] }, [])).toEqual([
            rounds[0],
        ]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, moduleTypes: ["MEMORY"] }, [])).toEqual([
            rounds[1],
        ]);
    });

    it("filters by battery count range", () => {
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, minBatteries: 1 }, [])).toEqual([rounds[0]]);
        expect(filterRounds(rounds, { ...EMPTY_CRITERIA, maxBatteries: 0 }, [])).toEqual([rounds[1]]);
        expect(
            filterRounds(rounds, { ...EMPTY_CRITERIA, minBatteries: 4, maxBatteries: 9 }, [])
        ).toEqual([]);
    });

    it("combines criteria with AND", () => {
        expect(
            filterRounds(rounds, { ...EMPTY_CRITERIA, status: RoundStatus.FAILED, search: "frk" }, [])
        ).toEqual([]);
    });
});

describe("collectFilterOptions", () => {
    it("collects distinct sorted values from all rounds", () => {
        const options = collectFilterOptions(rounds);
        expect(options.indicators).toEqual(["BOB", "FRK"]);
        expect(options.ports).toEqual([PortType.DVI, PortType.PARALLEL, PortType.RJ45]);
        expect(options.moduleTypes).toEqual(["MEMORY", "THE_BUTTON", "WIRES"]);
    });
});
