import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface SolverSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Render without the surrounding Card chrome (useful for nesting). */
  plain?: boolean;
}

/**
 * Titled section container for solver UIs.
 *
 * Visually a Card with an optional header row (title + description + actions)
 * and a padded content area. Uses design-token colors so it adapts to light
 * and dark themes automatically.
 */
export default function SolverSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  plain = false,
}: SolverSectionProps) {
  const header = (title || description || actions) && (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-3 border-b border-border">
      <div className="min-w-0">
        {title && (
          <h3 className="text-sm font-semibold leading-tight text-foreground">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );

  if (plain) {
    return (
      <section className={cn("space-y-3", className)}>
        {header}
        <div className={cn(contentClassName)}>{children}</div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden",
        className
      )}
    >
      {header}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
  );
}
