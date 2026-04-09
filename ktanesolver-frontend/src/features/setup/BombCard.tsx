import { type BombEntity, BombStatus } from "../../types";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/cn";

interface BombCardProps {
    bomb: BombEntity;
    onEditEdgework: (bomb: BombEntity) => void;
    onAddModules: (bomb: BombEntity) => void;
    animationDelay?: number;
}

function EditIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}

export default function BombCard({ bomb, onEditEdgework, onAddModules, animationDelay = 0 }: BombCardProps) {
    const isActive = bomb.status === BombStatus.ACTIVE;
    const moduleCount = bomb.modules?.length ?? 0;
    const hasModules = moduleCount > 0;

    // Group modules by type for display
    const moduleGroups: Record<string, number> = {};
    for (const mod of bomb.modules ?? []) {
        moduleGroups[mod.type] = (moduleGroups[mod.type] ?? 0) + 1;
    }

    return (
        <div
            className={cn(
                "card-manual animate-fade-in overflow-hidden",
                isActive && "border-l-[3px] border-l-[#15803D]"
            )}
            style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
        >
            {/* Card header */}
            <div className="bg-base-200 border-b border-base-300 px-4 py-3 flex items-center justify-between">
                <span className="font-display text-base font-bold uppercase tracking-wide text-base-content">
                    BOMB #{bomb.serialNumber || "???"}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onEditEdgework(bomb)}
                        aria-label="Edit edgework"
                        title="Edit edgework"
                    >
                        <EditIcon />
                    </Button>
                </div>
            </div>

            {/* Card body */}
            <div className="px-4 py-4 space-y-3">
                {/* Serial + batteries */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-ink-muted uppercase tracking-widest mb-0.5">Serial</p>
                        <p className="font-mono text-base font-medium text-base-content">{bomb.serialNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-ink-muted uppercase tracking-widest mb-0.5">Batteries</p>
                        <p className="font-mono text-base font-medium text-base-content">
                            <span title="AA batteries">{bomb.aaBatteryCount}<span className="text-xs text-ink-muted ml-0.5">AA</span></span>
                            {" / "}
                            <span title="D batteries">{bomb.dBatteryCount}<span className="text-xs text-ink-muted ml-0.5">D</span></span>
                        </p>
                    </div>
                </div>

                {/* Indicators */}
                <div>
                    <p className="text-xs text-ink-muted uppercase tracking-widest mb-1.5">Indicators</p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(bomb.indicators ?? {}).map(([name, lit]) => (
                            <span
                                key={`${bomb.id}-${name}`}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded-sm border",
                                    lit
                                        ? "bg-red-50 text-primary border-primary/30"
                                        : "bg-white text-ink-muted border-base-300"
                                )}
                            >
                                <span
                                    className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        lit ? "bg-primary" : "bg-base-300"
                                    )}
                                    aria-hidden
                                />
                                {name}
                            </span>
                        ))}
                        {Object.keys(bomb.indicators ?? {}).length === 0 && (
                            <span className="text-xs text-ink-muted italic">None</span>
                        )}
                    </div>
                </div>

                {/* Port plates */}
                <div>
                    <p className="text-xs text-ink-muted uppercase tracking-widest mb-1.5">Port plates</p>
                    <div className="flex flex-wrap gap-1">
                        {bomb.portPlates.length === 0 ? (
                            <span className="text-xs text-ink-muted">—</span>
                        ) : (
                            bomb.portPlates.map((plate, plateIndex) => (
                                <Badge key={`${bomb.id}-plate-${plateIndex}`} variant="outline" className="text-xs font-mono">
                                    {plate.ports?.length ? plate.ports.join(", ") : "Empty"}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Card footer */}
            <div className="bg-base-200 border-t border-base-300 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant={hasModules ? "info" : "default"} className="text-xs">
                        {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                    </Badge>
                    {isActive && (
                        <Badge variant="success" className="text-xs">Active</Badge>
                    )}
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onAddModules(bomb)}
                >
                    {hasModules ? "Configure Modules" : "Add Modules"}
                </Button>
            </div>
        </div>
    );
}
