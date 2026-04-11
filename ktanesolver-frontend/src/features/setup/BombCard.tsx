import { type BombEntity, BombStatus } from "../../types";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
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
            className={cn(
                "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden animate-fade-in",
                isActive && "border-l-4 border-l-emerald-500"
            )}
            style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
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
                    <div className="flex flex-wrap gap-1">
                        {bomb.portPlates.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
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

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/40">
                <div className="flex items-center gap-2">
                    <Badge variant={hasModules ? "info" : "secondary"} className="text-xs">
                        {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                    </Badge>
                    {isActive && <Badge variant="success" className="text-xs">Active</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={() => onAddModules(bomb)}>
                    {hasModules ? "Configure Modules" : "Add Modules"}
                </Button>
            </div>
        </div>
    );
}
