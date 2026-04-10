import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-sm border",
  {
    variants: {
      variant: {
        default:   "bg-base-200 text-base-content border-base-300",
        secondary: "bg-base-200 text-base-content border-base-300",
        primary:   "bg-red-50 text-primary border-primary/30",
        success:   "bg-green-50 text-success border-success/30",
        warning:   "bg-amber-50 text-warning border-warning/30",
        error:     "bg-red-50 text-error border-error/30",
        info:      "bg-blue-50 text-info border-info/30",
        outline:   "bg-transparent border-current text-current",
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
