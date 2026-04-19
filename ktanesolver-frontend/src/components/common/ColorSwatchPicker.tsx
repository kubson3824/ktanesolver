import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export interface ColorSwatchOption<T extends string> {
  value: T;
  label: string;
  /** Tailwind background class for the swatch. */
  swatch: string;
}

interface ColorSwatchPickerProps<T extends string> {
  value: T | null;
  options: ReadonlyArray<ColorSwatchOption<T>>;
  onChange: (value: T | null) => void;
  disabled?: boolean;
  /** Whether to render an X button that clears the selection. */
  clearable?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
}

/**
 * Row of circular color swatches with a selected state. Used by solvers that
 * require picking a single color from a small palette (Wires, Button strip, …).
 */
export default function ColorSwatchPicker<T extends string>({
  value,
  options,
  onChange,
  disabled,
  clearable = true,
  size = "md",
  ariaLabel,
  className,
}: ColorSwatchPickerProps<T>) {
  const sizeClass = size === "sm" ? "h-6 w-6" : "h-7 w-7";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1.5", className)}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.label}
            title={opt.label}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              sizeClass,
              "rounded-full transition-all",
              opt.swatch,
              selected
                ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                : "opacity-70 hover:opacity-100",
              disabled && "cursor-not-allowed",
            )}
          />
        );
      })}
      {clearable && (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled || value === null}
          aria-label="Clear selection"
          title="Clear"
          className={cn(
            sizeClass,
            "inline-flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors",
            "hover:text-foreground hover:border-foreground/40",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
