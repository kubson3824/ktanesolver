import { cn } from "../../lib/cn";

interface SolverResultProps {
  variant?: "success" | "warning" | "error" | "info";
  title: string;
  description?: string;
  className?: string;
}

export default function SolverResult({
  variant = "success",
  title,
  description,
  className,
}: SolverResultProps) {
  const variantClasses =
    variant === "success"
      ? "bg-emerald-50 border-l-4 border-l-emerald-500 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
      : variant === "warning"
      ? "bg-amber-50 border-l-4 border-l-amber-500 text-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
      : variant === "error"
      ? "bg-red-50 border-l-4 border-l-red-500 text-red-900 dark:bg-red-950/30 dark:text-red-400"
      : "bg-blue-50 border-l-4 border-l-blue-500 text-blue-900 dark:bg-blue-950/30 dark:text-blue-400";

  const titleColorClass =
    variant === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : variant === "warning"
      ? "text-amber-700 dark:text-amber-400"
      : variant === "error"
      ? "text-red-700 dark:text-red-400"
      : "text-blue-700 dark:text-blue-400";

  return (
    <div
      className={cn(
        "rounded-lg p-4",
        variantClasses,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <p className={cn("font-display text-sm uppercase tracking-widest mb-2", titleColorClass)}>
        {title}
      </p>
      {description && (
        <div className="space-y-1">
          {description.split("\n").map((line, i) => {
            const colonIdx = line.indexOf(":");
            if (colonIdx > -1) {
              const label = line.slice(0, colonIdx).trim();
              const value = line.slice(colonIdx + 1).trim();
              return (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="text-xs text-ink-muted uppercase tracking-wide shrink-0">
                    {label}:
                  </span>
                  <span className="font-mono-code text-sm font-medium text-base-content">
                    {value}
                  </span>
                </div>
              );
            }
            return (
              <p key={i} className="font-mono-code text-sm font-medium text-base-content">
                {line}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
