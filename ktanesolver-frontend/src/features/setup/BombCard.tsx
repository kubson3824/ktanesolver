import { type BombEntity, BombStatus, ModuleType } from "../../types";
import { getBombStatusBadgeVariant } from "../../lib/utils";
import { Card, CardHeader, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/cn";

const moduleTypes = Object.values(ModuleType);

const batteryIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
);

const portPlateIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v6a1 1 0 01-1 1h-3a1 1 0 01-1-1V7a1 1 0 00-1-1h-2z" />
    </svg>
);

interface BombCardProps {
    bomb: BombEntity;
    onEditEdgework: (bomb: BombEntity) => void;
    onAddModules: (bomb: BombEntity) => void;
    animationDelay?: number;
}

export default function BombCard({ bomb, onEditEdgework, onAddModules, animationDelay = 0 }: BombCardProps) {
    const isActive = bomb.status === BombStatus.ACTIVE;

    return (
        <Card
            className={cn(
                "animate-fade-in transition-colors border-panel-border bg-base-200/90 backdrop-blur-sm",
                "hover:border-panel-border hover:bg-base-200",
                isActive && "border-l-2 border-l-success"
            )}
            style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1 border-l-2 border-primary/40 pl-2 rounded pr-2 py-1">
                        <p className="text-xs text-secondary uppercase tracking-wider">Serial</p>
                        <p className="text-xl font-mono font-bold mt-1 truncate">
                            {bomb.serialNumber || "Unknown"}
                        </p>
                    </div>
                    <Badge variant={getBombStatusBadgeVariant(bomb.status)} className="shrink-0 text-caption">
                        {bomb.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-caption text-secondary">
                        {batteryIcon}
                        AA / D
                    </span>
                    <span className="font-mono font-bold text-body">
                        {bomb.aaBatteryCount} / {bomb.dBatteryCount}
                    </span>
                </div>

                <div>
                    <span className="flex items-center gap-1.5 text-caption text-secondary mb-1.5">
                        <span className="h-2 w-2 rounded-full bg-success/80" aria-hidden />
                        Indicators
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(bomb.indicators ?? {}).map(([name, lit]) => (
                            <Badge
                                key={`${bomb.id}-${name}`}
                                variant={lit ? "success" : "outline"}
                                className="text-caption"
                            >
                                {name}
                            </Badge>
                        ))}
                        {Object.keys(bomb.indicators ?? {}).length === 0 && (
                            <span className="text-caption text-base-content/50 italic">None</span>
                        )}
                    </div>
                </div>

                <div>
                    <span className="flex items-center gap-1.5 text-caption text-secondary mb-1.5">
                        {portPlateIcon}
                        Port plates
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {bomb.portPlates.length === 0 ? (
                            <span className="text-caption text-base-content/50">—</span>
                        ) : (
                            bomb.portPlates.map((plate, plateIndex) => (
                                <Badge key={`${bomb.id}-plate-${plateIndex}`} variant="outline" className="text-caption">
                                    Plate {plateIndex + 1}: {plate.ports?.length ? plate.ports.join(", ") : "Empty"}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>

                <div className="border-t border-base-300 pt-3 mt-2">
                    <div className="flex flex-wrap gap-1 mb-3">
                        {moduleTypes.map((type) => {
                            const count = bomb.modules?.filter((m) => m.type === type).length ?? 0;
                            if (count === 0) return null;
                            return (
                                <Badge key={type} variant="info" className="text-caption">
                                    {type.replaceAll("_", " ")} ({count})
                                </Badge>
                            );
                        })}
                        {(!bomb.modules || bomb.modules.length === 0) && (
                            <p className="text-caption text-base-content/50 italic">No modules yet</p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => onEditEdgework(bomb)}>
                            Adjust edgework
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => onAddModules(bomb)}>
                            Add modules
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
