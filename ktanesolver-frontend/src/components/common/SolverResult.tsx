import { cn } from "../../lib/cn";

interface SolverResultProps {
  variant?: "success" | "warning" | "info";
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
  const isSuccess = variant === "success";

  return (
    <div
      className={cn(
        "callout",
        isSuccess ? "callout-success" : variant === "warning" ? "callout-warning" : "callout-info",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <p className="font-display text-sm uppercase tracking-widest text-success mb-2">
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
