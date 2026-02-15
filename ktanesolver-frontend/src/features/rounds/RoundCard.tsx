import { type RoundEntity, RoundStatus } from "../../types";
import {
  getRoundStatusLabel,
  getRoundStatusBadgeVariant,
  getBombStatusBadgeVariant,
} from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/cn";

interface RoundCardProps {
  round: RoundEntity;
  onNavigate: (roundId: string) => void;
  onDelete: (roundId: string) => void;
  loading: boolean;
}

export default function RoundCard({ round, onNavigate, onDelete, loading }: RoundCardProps) {
  return (
    <Card
      className={cn(
        "animate-fade-in transition-colors border-panel-border bg-base-200/90 backdrop-blur-sm",
        "hover:border-panel-border hover:bg-base-200"
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl font-bold mt-0">
                  Round {round.id.slice(-8)}
                </CardTitle>
                <Badge
                  variant={getRoundStatusBadgeVariant(round.status)}
                  className="shrink-0 text-caption"
                >
                  {getRoundStatusLabel(round.status)}
                </Badge>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1 bg-base-300/50 rounded-lg px-4 py-3 border border-base-300 min-w-0">
                <span className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Total bombs
                </span>
                <div className="text-2xl font-bold tabular-nums">
                  {round.bombs.length}
                </div>
              </div>
              <div className="flex flex-col gap-1 bg-base-300/50 rounded-lg px-4 py-3 border border-base-300 min-w-0">
                <span className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Modules
                </span>
                <div className="text-2xl font-bold tabular-nums">
                  {round.bombs.reduce(
                    (sum, bomb) => sum + (bomb.modules?.length ?? 0),
                    0
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-caption text-secondary">Created</span>
              <div className="text-body font-medium mt-1">
                {round.startTime
                  ? new Date(round.startTime).toLocaleString()
                  : "Not started"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={() => onNavigate(round.id)}>
                {round.status === RoundStatus.ACTIVE ? "Continue" : "View"} Round
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

          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3 text-section-title">
              Bombs in this round
            </h3>
            {round.bombs.length === 0 ? (
              <p className="text-caption text-base-content/50 italic">
                No bombs in this round
              </p>
            ) : (
              <div className="space-y-2">
                {round.bombs.map((bomb) => (
                  <Card key={bomb.id} className="bg-base-200/80">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono text-body">
                            {bomb.serialNumber || "Unknown serial"}
                          </span>
                          <div className="text-caption text-secondary mt-1">
                            {bomb.modules?.length ?? 0} modules
                          </div>
                        </div>
                        <Badge
                          variant={getBombStatusBadgeVariant(bomb.status)}
                          className="shrink-0 text-caption"
                        >
                          {bomb.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
