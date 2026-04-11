import { Loader2, Check } from "lucide-react";
import type { BombEntity, ModuleEntity } from "../../types";
import { formatModuleName } from "../../lib/utils";
import { cn } from "../../lib/cn";

interface ModuleGridProps {
  bombs: BombEntity[];
  currentBomb: BombEntity | null | undefined;
  regularModules: ModuleEntity[];
  onSelectBomb: (bombId: string) => void;
  onSelectModule: (module: ModuleEntity) => void;
  openingModuleId?: string | null;
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
    <div>
      {/* Bomb selector tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {bombs.map((bomb, index) => {
          const isActive = currentBomb?.id === bomb.id;
          const serial = bomb.serialNumber ? bomb.serialNumber.slice(0, 6) : "???";
          return (
            <button
              key={bomb.id}
              type="button"
              onClick={() => onSelectBomb(bomb.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium font-mono border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              )}
            >
              Bomb {index + 1}{" "}
              <span className="text-xs opacity-70">{serial}</span>
            </button>
          );
        })}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {regularModules.length === 0 && (
          <div className="col-span-full text-center py-12 px-4">
            <p className="text-sm text-muted-foreground">No regular modules.</p>
          </div>
        )}

        {regularModules.map((module) => {
          const name = formatModuleName(module.type);
          const shortId = module.id.replace(/-/g, "").slice(-6);
          const isOpening = openingModuleId === module.id;
          const disabled = isOpening;

          return (
            <div
              key={module.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`${name} — ${module.solved ? "Solved" : isOpening ? "Opening" : "Awaiting"}`}
              aria-disabled={disabled}
              aria-busy={isOpening}
              className={cn(
                "rounded-lg border bg-card transition-all overflow-hidden cursor-pointer hover:shadow-md",
                module.solved && "border-emerald-200 dark:border-emerald-900 opacity-60",
                isOpening && "border-accent/50 ring-2 ring-accent/30 opacity-80",
                !isOpening && !module.solved && "border-border hover:border-accent/40"
              )}
              onClick={() => !disabled && onSelectModule(module)}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectModule(module);
                }
              }}
            >
              {/* Status top bar */}
              <div
                className={cn(
                  "h-0.5 w-full",
                  module.solved ? "bg-emerald-500" : "bg-transparent"
                )}
              />

              <div className="p-2">
                <p className="text-xs font-semibold text-foreground text-center truncate">
                  {name}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground text-center mt-0.5">
                  {shortId}
                </p>

                <div className="flex justify-center mt-1.5">
                  {module.solved ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
                  ) : isOpening ? (
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" aria-hidden />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
