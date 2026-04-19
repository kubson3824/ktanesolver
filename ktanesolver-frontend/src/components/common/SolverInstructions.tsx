import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface SolverInstructionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Muted instructional text shown at the bottom of a solver (e.g. keybind
 * hints, color legends, input format tips).
 */
export default function SolverInstructions({
  children,
  className,
}: SolverInstructionsProps) {
  return (
    <div className={cn("text-xs text-muted-foreground", className)}>
      {children}
    </div>
  );
}
