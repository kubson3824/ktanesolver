import { type RoundEntity, RoundStatus } from "../../types";
import {
  getRoundStatusLabel,
  getRoundStatusBadgeVariant,
} from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/cn";

interface RoundCardProps {
  round: RoundEntity;
  onNavigate: (roundId: string) => void;
  onDelete: (roundId: string) => void;
  loading: boolean;
}

function getStatusBorderColor(status: RoundStatus): string {
  switch (status) {
    case RoundStatus.SETUP:
      return "border-l-[#6B7280]"; // neutral gray
    case RoundStatus.ACTIVE:
      return "border-l-[#B45309]"; // warning amber
    case RoundStatus.COMPLETED:
      return "border-l-[#15803D]"; // success green
    case RoundStatus.FAILED:
      return "border-l-[#C41230]"; // error red
    default:
      return "border-l-[#6B7280]"; // neutral gray
  }
}

export default function RoundCard({ round, onNavigate, onDelete, loading }: RoundCardProps) {
  const totalModules = round.bombs.reduce(
    (sum, bomb) => sum + (bomb.modules?.length ?? 0),
    0
  );

  const shortId = round.id.slice(0, 8);

  return (
    <div
      className={cn(
        "card-manual border-l-4",
        getStatusBorderColor(round.status)
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Left: ID + status badge */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-xs text-ink-muted">{shortId}</span>
          <Badge variant={getRoundStatusBadgeVariant(round.status)}>
            {getRoundStatusLabel(round.status)}
          </Badge>
        </div>

        {/* Middle: bomb + module count */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-muted">
            {round.bombs.length} {round.bombs.length === 1 ? "bomb" : "bombs"} &middot; {totalModules} {totalModules === 1 ? "module" : "modules"}
          </p>
          {round.startTime && (
            <p className="text-xs text-ink-muted mt-0.5">
              {new Date(round.startTime).toLocaleString()}
            </p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate(round.id)}
          >
            {round.status === RoundStatus.ACTIVE ? "Continue" : "View"}
          </Button>
          <Button
            variant="danger"
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
