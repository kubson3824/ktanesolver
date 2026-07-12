import { type ModuleCatalogItem, type RoundSummary, PortType, RoundStatus } from "../../types";
import { PORTS } from "../../lib/ports";

export interface RoundFilterCriteria {
    search: string;
    status?: RoundStatus;
    indicators: string[];
    ports: PortType[];
    moduleTypes: string[];
    minBatteries?: number;
    maxBatteries?: number;
}

export const EMPTY_CRITERIA: RoundFilterCriteria = {
    search: "",
    indicators: [],
    ports: [],
    moduleTypes: [],
};

export function countActiveFilters(criteria: RoundFilterCriteria): number {
    return (
        (criteria.status ? 1 : 0) +
        criteria.indicators.length +
        criteria.ports.length +
        criteria.moduleTypes.length +
        (criteria.minBatteries !== undefined ? 1 : 0) +
        (criteria.maxBatteries !== undefined ? 1 : 0)
    );
}

export function moduleLabel(type: string, catalog: ModuleCatalogItem[]): string {
    const item = catalog.find((m) => m.type === type);
    if (item) return item.name;
    // Fallback: FOLLOW_THE_LEADER -> Follow The Leader
    return type
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/** Distinct values present across the loaded rounds, for building filter options. */
export function collectFilterOptions(rounds: RoundSummary[]) {
    const indicators = new Set<string>();
    const ports = new Set<PortType>();
    const moduleTypes = new Set<string>();
    for (const round of rounds) {
        for (const bomb of round.bombs ?? []) {
            Object.keys(bomb.indicators).forEach((name) => indicators.add(name));
            bomb.ports.forEach((port) => ports.add(port));
            bomb.moduleTypes.forEach((type) => moduleTypes.add(type));
        }
    }
    return {
        indicators: [...indicators].sort(),
        ports: [...ports].sort(),
        moduleTypes: [...moduleTypes].sort(),
    };
}

export function filterRounds(
    rounds: RoundSummary[],
    criteria: RoundFilterCriteria,
    catalog: ModuleCatalogItem[]
): RoundSummary[] {
    const search = criteria.search.trim().toLowerCase();
    return rounds.filter((round) => {
        const bombs = round.bombs ?? [];

        if (criteria.status && round.status !== criteria.status) return false;

        const allIndicators = new Set(bombs.flatMap((b) => Object.keys(b.indicators)));
        if (!criteria.indicators.every((name) => allIndicators.has(name))) return false;

        const allPorts = new Set(bombs.flatMap((b) => b.ports));
        if (!criteria.ports.every((port) => allPorts.has(port))) return false;

        const allModules = new Set(bombs.flatMap((b) => b.moduleTypes));
        if (!criteria.moduleTypes.every((type) => allModules.has(type))) return false;

        if (criteria.minBatteries !== undefined || criteria.maxBatteries !== undefined) {
            const inRange = bombs.some((b) => {
                const total = b.aaBatteryCount + b.dBatteryCount;
                return (
                    (criteria.minBatteries === undefined || total >= criteria.minBatteries) &&
                    (criteria.maxBatteries === undefined || total <= criteria.maxBatteries)
                );
            });
            if (!inRange) return false;
        }

        if (search) {
            const haystack = [
                round.id,
                ...bombs.flatMap((b) => [
                    b.serialNumber ?? "",
                    ...Object.keys(b.indicators),
                    ...b.ports.flatMap((p) => [p, PORTS[p]?.label ?? ""]),
                    ...b.moduleTypes.flatMap((t) => [t, moduleLabel(t, catalog)]),
                ]),
            ]
                .join(" ")
                .toLowerCase();
            if (!haystack.includes(search)) return false;
        }

        return true;
    });
}
