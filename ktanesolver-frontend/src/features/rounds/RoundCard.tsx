import { type RoundSummary, RoundStatus } from "../../types";
import { getRoundStatusLabel, getRoundStatusBadgeVariant } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/cn";

interface RoundCardProps {
  round: RoundSummary;
  onNavigate: (roundId: string) => void;
  onDelete: (roundId: string) => void;
  loading: boolean;
}

function getStatusAccent(status: RoundStatus): string {
  switch (status) {
    case RoundStatus.ACTIVE:    return "border-l-amber-500";
    case RoundStatus.COMPLETED: return "border-l-emerald-500";
    case RoundStatus.FAILED:    return "border-l-destructive";
    default:                    return "border-l-border";
  }
}

export default function RoundCard({ round, onNavigate, onDelete, loading }: RoundCardProps) {
  const shortId = round.id.slice(0, 8);

  return (
    <div
      className={cn(
        "rounded-xl border-l-4 bg-card border border-border shadow-sm",
        getStatusAccent(round.status)
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-xs text-muted-foreground">{shortId}</span>
          <Badge variant={getRoundStatusBadgeVariant(round.status)}>
            {getRoundStatusLabel(round.status)}
          </Badge>
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
    </div>
  );
}
