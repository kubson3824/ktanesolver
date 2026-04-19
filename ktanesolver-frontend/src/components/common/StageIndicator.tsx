import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

interface StageIndicatorProps {
  /** Total number of stages. */
  total: number;
  /** 1-based current stage. */
  current: number;
  /** 1-based index of the last completed stage. Defaults to current - 1. */
  completedThrough?: number;
  className?: string;
  label?: string;
}

/**
 * Horizontal progress indicator for multi-stage modules (Memory, Who's On First, …).
 * Completed stages render as filled check pills, the current stage is accented,
 * pending stages are muted.
 */
export default function StageIndicator({
  total,
  current,
  completedThrough,
  className,
  label = "Stage",
}: StageIndicatorProps) {
  const completed = completedThrough ?? current - 1;

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: total }, (_, i) => {
        const stage = i + 1;
        const isCompleted = stage <= completed;
        const isCurrent = stage === current && !isCompleted;
        return (
          <div key={stage} className="flex items-center gap-2">
            <div
              role="img"
              aria-label={`${label} ${stage}${isCompleted ? " (done)" : isCurrent ? " (current)" : ""}`}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                isCompleted && "bg-emerald-600 text-white",
                isCurrent && "bg-accent text-accent-foreground ring-2 ring-accent/40",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" aria-hidden /> : stage}
            </div>
            {stage < total && (
              <div
                aria-hidden
                className={cn(
                  "h-0.5 w-4 rounded-full transition-colors",
                  isCompleted ? "bg-emerald-600" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
