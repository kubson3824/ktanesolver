import { type BombEntity, BombStatus } from "../../types";
import { Button } from "../../components/ui/button";
import PortIcon from "../../components/PortIcon";
import { portLabel } from "../../lib/ports";
import { Trash2, Pencil } from "lucide-react";
import { cn } from "../../lib/cn";

interface BombCardProps {
    bomb: BombEntity;
    index: number;
    onEditEdgework: (bomb: BombEntity) => void;
    onAddModules: (bomb: BombEntity) => void;
    onDelete?: (bomb: BombEntity) => void;
    animationDelay?: number;
}

export default function BombCard({ bomb, index, onEditEdgework, onAddModules, onDelete, animationDelay = 0 }: BombCardProps) {
    const isActive = bomb.status === BombStatus.ACTIVE;
    const moduleCount = bomb.modules?.length ?? 0;
    const hasModules = moduleCount > 0;

    return (
        <div
            className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden animate-fade-in"
            style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
        >
            <div className="h-[3px]" style={{ background: isActive ? "#2FA876" : "transparent" }} />
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
                <span className="font-semibold text-sm text-foreground">
                    Bomb {index + 1}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onEditEdgework(bomb)}
                        aria-label="Edit edgework"
                        title="Edit edgework"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onDelete(bomb)}
                            aria-label="Delete bomb"
                            title="Delete bomb"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Serial</p>
                        <p className="font-mono text-sm font-medium text-foreground">{bomb.serialNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Batteries</p>
                        <p className="font-mono text-sm font-medium text-foreground">
                            <span title="AA batteries">{bomb.aaBatteryCount}<span className="text-xs text-muted-foreground ml-0.5">AA</span></span>
                            {" / "}
                            <span title="D batteries">{bomb.dBatteryCount}<span className="text-xs text-muted-foreground ml-0.5">D</span></span>
                        </p>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Indicators</p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(bomb.indicators ?? {}).map(([name, lit]) => (
                            <span
                                key={`${bomb.id}-${name}`}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded-full border",
                                    lit
                                        ? "bg-accent/10 text-accent border-accent/30"
                                        : "bg-muted text-muted-foreground border-border"
                                )}
                            >
                                <span
                                    className={cn("h-1.5 w-1.5 rounded-full", lit ? "bg-accent" : "bg-muted-foreground/40")}
                                    aria-hidden
                                />
                                {name}
                            </span>
                        ))}
                        {Object.keys(bomb.indicators ?? {}).length === 0 && (
                            <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Port plates</p>
                    <div className="flex flex-wrap gap-1.5">
                        {bomb.portPlates.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                            bomb.portPlates.map((plate, plateIndex) => (
                                <span
                                    key={`${bomb.id}-plate-${plateIndex}`}
                                    className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/60 px-2 py-1 min-h-[28px]"
                                    title={plate.ports?.length ? plate.ports.map(portLabel).join(", ") : "Empty plate"}
                                >
                                    {plate.ports?.length ? (
                                        plate.ports.map((port, portIndex) => (
                                            <PortIcon key={`${port}-${portIndex}`} port={port} className="h-4 w-auto" />
                                        ))
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground italic">Empty</span>
                                    )}
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                            !hasModules && "bg-muted text-muted-foreground"
                        )}
                        style={hasModules
                            ? { background: "rgba(90,150,220,0.18)", color: "#3D6FB0" }
                            : undefined}
                    >
                        {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                    </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => onAddModules(bomb)}>
                    {hasModules ? "Configure Modules" : "Add Modules"}
                </Button>
            </div>
        </div>
    );
}
