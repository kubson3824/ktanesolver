import type { BombEntity, ModuleEntity } from "../../types";
import { formatModuleDisplayName } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/cn";

interface ModuleGridProps {
  bombs: BombEntity[];
  currentBomb: BombEntity | null | undefined;
  regularModules: ModuleEntity[];
  onSelectBomb: (bombId: string) => void;
  onSelectModule: (module: ModuleEntity) => void;
  /** Module ID currently being opened; show loading and ignore further clicks. */
  openingModuleId?: string | null;
}

function SolvedIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AwaitingIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function ModuleGrid({
  bombs,
  currentBomb,
  regularModules,
  onSelectBomb,
  onSelectModule,
  openingModuleId,
}: ModuleGridProps) {
  return (
    <Card className="border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
      <CardHeader className="pb-4">
        <p className="text-sm text-secondary font-medium uppercase tracking-wider">Current bomb</p>
        <CardTitle className="text-section-title mt-1">Module list</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Bomb tabs - stats-style strip */}
        <div className="flex flex-wrap gap-2 mb-6">
          {bombs.map((bomb) => (
            <button
              key={bomb.id}
              type="button"
              className={cn(
                "flex flex-col gap-1 rounded-lg px-4 py-3 border text-left min-w-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200",
                currentBomb?.id === bomb.id
                  ? "bg-primary/20 border-primary text-base-content"
                  : "bg-base-300/50 border-base-300 hover:bg-base-300/80 text-base-content"
              )}
              onClick={() => onSelectBomb(bomb.id)}
            >
              <span className="text-xs font-medium uppercase tracking-wider text-secondary">Serial</span>
              <span className="text-xl font-mono font-bold truncate">{bomb.serialNumber || "Unknown"}</span>
              <span className="text-caption text-base-content/60">{bomb.modules.length} modules</span>
            </button>
          ))}
        </div>

        {/* Module cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regularModules.length === 0 && (
            <div className="col-span-full text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-300 mb-4" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                </svg>
              </div>
              <p className="text-body text-base-content/70 mb-2">No regular modules yet.</p>
              <p className="text-caption text-base-content/60 mb-6">
                No regular modules are assigned to this bomb. Add modules in setup to see them here.
              </p>
            </div>
          )}
          {regularModules.map((module, index) => {
            const displayName = formatModuleDisplayName(module.type, module.id);
            const isOpening = openingModuleId === module.id;
            const disabled = isOpening;
            return (
            <Card
              key={module.id}
              className={cn(
                "animate-fade-in transition-colors border-panel-border bg-base-200/90 backdrop-blur-sm",
                module.solved && "border-l-2 border-l-success",
                disabled
                  ? "cursor-not-allowed opacity-80"
                  : "cursor-pointer hover:border-panel-border hover:bg-base-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200"
              )}
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
              tabIndex={disabled ? -1 : 0}
              role="button"
              title={isOpening ? "Opening…" : undefined}
              onClick={() => !disabled && onSelectModule(module)}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectModule(module);
                }
              }}
              aria-label={
                disabled
                  ? `${displayName} — Opening…`
                  : `${displayName} — ${module.solved ? "Solved" : "Awaiting"}`
              }
              aria-disabled={disabled}
              aria-busy={isOpening}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1 border-l-2 border-primary/40 pl-2 rounded pr-2 py-1">
                    <p className="text-xs text-secondary uppercase tracking-wider">Module</p>
                    <p className="text-card-title font-semibold mt-1 truncate">{displayName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOpening && (
                      <span className="loading loading-spinner loading-sm text-primary" aria-hidden />
                    )}
                    <Badge
                      variant={module.solved ? "success" : "warning"}
                      className="text-caption"
                    >
                      {module.solved ? "Solved" : isOpening ? "Opening…" : "Awaiting"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex flex-row items-start gap-2">
                {module.solved ? (
                  <SolvedIcon />
                ) : isOpening ? (
                  <span className="loading loading-spinner loading-sm text-primary shrink-0" aria-hidden />
                ) : (
                  <AwaitingIcon />
                )}
                <p className="text-caption text-base-content/70">
                  {module.solved
                    ? "Cleared. Click to review."
                    : isOpening
                      ? "Opening…"
                      : "Click to open solver."}
                </p>
              </CardContent>
            </Card>
          );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
