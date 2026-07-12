import { useState } from "react";
import { type BombSummary, type RoundSummary, RoundStatus } from "../../types";
import { getRoundStatusLabel } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import PortIcon from "../../components/PortIcon";
import { PORTS } from "../../lib/ports";
import { useCatalogStore } from "../../store/useCatalogStore";
import { moduleLabel } from "./roundFilters";

interface RoundCardProps {
  round: RoundSummary;
  onNavigate: (roundId: string) => void;
  onDelete: (roundId: string) => void;
  loading: boolean;
}

// Status accent + pill colors from the design prototype (same values in both themes)
const STATUS_STYLES: Record<RoundStatus, { accent: string; bg: string; color: string }> = {
  [RoundStatus.SETUP]:     { accent: "#8A8A7E", bg: "#EAE3D2", color: "#5C5B4F" },
  [RoundStatus.ACTIVE]:    { accent: "#F59E0B", bg: "#F2DFB3", color: "#7A4A12" },
  [RoundStatus.COMPLETED]: { accent: "#2FA876", bg: "rgba(47,168,118,0.18)", color: "#1F8F63" },
  [RoundStatus.FAILED]:    { accent: "#EF4444", bg: "#F2DAD3", color: "#8C3229" },
};

function batteryLabel(bomb: BombSummary): string {
  const parts = [];
  if (bomb.aaBatteryCount > 0) parts.push(`${bomb.aaBatteryCount} AA`);
  if (bomb.dBatteryCount > 0) parts.push(`${bomb.dBatteryCount} D`);
  return parts.length > 0 ? parts.join(" · ") : "No batteries";
}

function BombDetails({ bomb, showLabel }: { bomb: BombSummary; showLabel: boolean }) {
  const [modulesOpen, setModulesOpen] = useState(false);
  const catalog = useCatalogStore((state) => state.catalog);

  const moduleCounts = bomb.moduleTypes.reduce<Record<string, number>>((acc, type) => {
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {showLabel && <span className="text-[11px] text-muted-foreground uppercase">Bomb</span>}
        <Badge variant="outline" className="font-mono">
          {bomb.serialNumber || "no serial"}
        </Badge>
        <Badge variant="secondary">{batteryLabel(bomb)}</Badge>
        {Object.entries(bomb.indicators).map(([name, lit]) => (
          <Badge key={name} variant={lit ? "warning" : "outline"} title={lit ? "Lit" : "Unlit"}>
            {lit ? "●" : "○"} {name}
          </Badge>
        ))}
        {bomb.ports.map((port) => (
          <Badge key={port} variant="outline" className="gap-1.5 font-normal">
            <PortIcon port={port} className="h-3 w-auto" />
            {PORTS[port]?.label ?? port}
          </Badge>
        ))}
        {bomb.moduleTypes.length > 0 && (
          <button
            type="button"
            onClick={() => setModulesOpen((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {bomb.moduleTypes.length} {bomb.moduleTypes.length === 1 ? "module" : "modules"}{" "}
            {modulesOpen ? "▴" : "▾"}
          </button>
        )}
      </div>
      {modulesOpen && (
        <div className="flex items-center gap-1.5 flex-wrap pl-1">
          {Object.entries(moduleCounts).map(([type, count]) => (
            <Badge key={type} variant="secondary" className="font-normal">
              {moduleLabel(type, catalog)}
              {count > 1 ? ` ×${count}` : ""}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoundCard({ round, onNavigate, onDelete, loading }: RoundCardProps) {
  const shortId = round.id.slice(0, 8);
  const status = STATUS_STYLES[round.status] ?? STATUS_STYLES[RoundStatus.SETUP];
  const bombs = round.bombs ?? [];

  return (
    <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
      <div className="h-[3px]" style={{ background: status.accent }} />
      <div className="flex items-center gap-4 px-4 py-3.5 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-xs text-muted-foreground">{shortId}</span>
          <span
            className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {getRoundStatusLabel(round.status)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {round.bombCount} {round.bombCount === 1 ? "bomb" : "bombs"} &middot;{" "}
            {round.moduleCount} {round.moduleCount === 1 ? "module" : "modules"}
          </p>
          {round.startTime && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(round.startTime).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onNavigate(round.id)}>
            {round.status === RoundStatus.ACTIVE ? "Continue" : "View"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(round.id)}
            disabled={loading}
          >
            Delete
          </Button>
        </div>
      </div>

      {bombs.length > 0 && (
        <div className="px-4 pb-3.5 flex flex-col gap-2 border-t border-border pt-3">
          {bombs.map((bomb, index) => (
            <BombDetails key={index} bomb={bomb} showLabel={bombs.length > 1} />
          ))}
        </div>
      )}
    </div>
  );
}
