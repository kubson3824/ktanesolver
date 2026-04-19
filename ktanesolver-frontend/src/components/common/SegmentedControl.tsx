import { cn } from "../../lib/cn";

interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: React.ReactNode }>;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}

/**
 * Compact segmented button group for selecting one of a small enumerated
 * set of values (e.g. wire count 3/4/5/6). Uses design-token colors.
 */
export default function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  disabled,
  className,
  size = "md",
  ariaLabel,
}: SegmentedControlProps<T>) {
  const sizeClasses = size === "sm" ? "h-8 text-xs" : "h-9 text-sm";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center rounded px-3 font-medium transition-colors",
              sizeClasses,
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
