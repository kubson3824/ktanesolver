import type { BombEntity, ModuleEntity } from "../../types";
import { formatModuleName } from "../../lib/utils";
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
      <div className="flex gap-1 mb-4 flex-wrap">
        {bombs.map((bomb, index) => {
          const isActive = currentBomb?.id === bomb.id;
          const serial = bomb.serialNumber
            ? bomb.serialNumber.slice(0, 6)
            : "???";
          return (
            <button
              key={bomb.id}
              type="button"
              onClick={() => onSelectBomb(bomb.id)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-sm font-semibold font-mono border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-content border-primary"
                  : "bg-base-200 text-base-content border-base-300 hover:bg-base-300"
              )}
            >
              BOMB {index + 1}{" "}
              <span className="font-mono text-xs opacity-80">{serial}</span>
            </button>
          );
        })}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {regularModules.length === 0 && (
          <div className="col-span-full text-center py-12 px-4">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-base-300 mb-3"
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"
                />
              </svg>
            </div>
            <p className="text-sm text-base-content/70">No regular modules.</p>
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
                "bg-base-100 border border-base-300 rounded-sm transition-shadow overflow-hidden cursor-pointer hover:shadow-card-sm",
                module.solved && "border-success bg-green-50/50",
                isOpening && "border-primary bg-primary/5 opacity-70",
                !isOpening && !module.solved && ""
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
                  "h-1 w-full",
                  module.solved ? "bg-success" : "bg-base-300"
                )}
              />

              {/* Tile content */}
              <div className="p-2">
                <p className="text-xs font-semibold text-base-content text-center truncate">
                  {name}
                </p>
                <p className="text-[10px] font-mono text-ink-muted text-center mt-0.5">
                  {shortId}
                </p>

                {/* Status indicator */}
                <div className="flex justify-center mt-1.5">
                  {module.solved ? (
                    <svg
                      className="w-3.5 h-3.5 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isOpening ? (
                    <span
                      className="loading loading-spinner loading-xs text-primary"
                      aria-hidden
                    />
                  ) : (
                    <span className="text-[10px] text-ink-muted">—</span>
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
