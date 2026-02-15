import { cn } from "../../lib/cn";

interface SolverResultProps {
  variant?: "success" | "warning" | "info";
  title: string;
  description?: string;
  className?: string;
}

const variantClasses = {
  success: "bg-success/10 border-success/30 text-success",
  warning: "bg-warning/10 border-warning/30 text-warning",
  info: "bg-info/10 border-info/30 text-info",
};

const variantIcons = {
  success: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function SolverResult({
  variant = "success",
  title,
  description,
  className,
}: SolverResultProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 mb-4 animate-fade-in shadow-sm",
        variantClasses[variant],
        className
      )}
      role="status"
      aria-live="polite"
    >
      {variantIcons[variant]}
      <div>
        <span className="font-bold">{title}</span>
        {description && <p className="text-sm mt-1 opacity-90">{description}</p>}
      </div>
    </div>
  );
}
