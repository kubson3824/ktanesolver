import { useState } from "react";
import { type ModuleCatalogItem, PortType, RoundStatus } from "../../types";
import { getRoundStatusLabel } from "../../lib/utils";
import { PORTS } from "../../lib/ports";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
    type RoundFilterCriteria,
    EMPTY_CRITERIA,
    countActiveFilters,
    moduleLabel,
} from "./roundFilters";

interface RoundFilterBarProps {
    criteria: RoundFilterCriteria;
    onChange: (criteria: RoundFilterCriteria) => void;
    options: { indicators: string[]; ports: PortType[]; moduleTypes: string[] };
    catalog: ModuleCatalogItem[];
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-foreground hover:bg-secondary"
            )}
        >
            {children}
        </button>
    );
}

function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function RoundFilterBar({ criteria, onChange, options, catalog }: RoundFilterBarProps) {
    const [expanded, setExpanded] = useState(false);
    const activeCount = countActiveFilters(criteria);

    const parseCount = (value: string): number | undefined =>
        value === "" ? undefined : Math.max(0, Number(value));

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Input
                    type="search"
                    placeholder="Search serial, indicator, port, module..."
                    value={criteria.search}
                    onChange={(e) => onChange({ ...criteria, search: e.target.value })}
                    className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
                    Filters{activeCount > 0 ? ` (${activeCount})` : ""} {expanded ? "▴" : "▾"}
                </Button>
                {(activeCount > 0 || criteria.search) && (
                    <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_CRITERIA)}>
                        Clear
                    </Button>
                )}
            </div>

            {expanded && (
                <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Status</span>
                        {Object.values(RoundStatus).map((status) => (
                            <FilterChip
                                key={status}
                                active={criteria.status === status}
                                onClick={() =>
                                    onChange({
                                        ...criteria,
                                        status: criteria.status === status ? undefined : status,
                                    })
                                }
                            >
                                {getRoundStatusLabel(status)}
                            </FilterChip>
                        ))}
                    </div>

                    {options.indicators.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Indicators</span>
                            {options.indicators.map((name) => (
                                <FilterChip
                                    key={name}
                                    active={criteria.indicators.includes(name)}
                                    onClick={() =>
                                        onChange({ ...criteria, indicators: toggle(criteria.indicators, name) })
                                    }
                                >
                                    {name}
                                </FilterChip>
                            ))}
                        </div>
                    )}

                    {options.ports.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Ports</span>
                            {options.ports.map((port) => (
                                <FilterChip
                                    key={port}
                                    active={criteria.ports.includes(port)}
                                    onClick={() => onChange({ ...criteria, ports: toggle(criteria.ports, port) })}
                                >
                                    {PORTS[port]?.label ?? port}
                                </FilterChip>
                            ))}
                        </div>
                    )}

                    {options.moduleTypes.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Modules</span>
                            {options.moduleTypes.map((type) => (
                                <FilterChip
                                    key={type}
                                    active={criteria.moduleTypes.includes(type)}
                                    onClick={() =>
                                        onChange({ ...criteria, moduleTypes: toggle(criteria.moduleTypes, type) })
                                    }
                                >
                                    {moduleLabel(type, catalog)}
                                </FilterChip>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Batteries</span>
                        <Input
                            type="number"
                            min={0}
                            placeholder="min"
                            value={criteria.minBatteries ?? ""}
                            onChange={(e) => onChange({ ...criteria, minBatteries: parseCount(e.target.value) })}
                            className="w-20"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                            type="number"
                            min={0}
                            placeholder="max"
                            value={criteria.maxBatteries ?? ""}
                            onChange={(e) => onChange({ ...criteria, maxBatteries: parseCount(e.target.value) })}
                            className="w-20"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
