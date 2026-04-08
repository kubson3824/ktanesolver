import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold text-sm transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm",
  {
    variants: {
      variant: {
        primary:   "bg-primary text-primary-content hover:bg-primary-focus border border-primary",
        secondary: "bg-white text-base-content border border-base-content hover:bg-base-200",
        outline:   "bg-transparent text-base-content border border-base-content hover:bg-base-200",
        ghost:     "bg-transparent text-ink-muted border border-transparent hover:bg-base-200 hover:text-base-content",
        danger:    "bg-error text-error-content hover:bg-primary-focus border border-error",
        success:   "bg-success text-success-content hover:bg-green-700 border border-success",
      },
      size: {
        xs: "px-2 py-1 text-xs",
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-base",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="loading loading-spinner loading-xs" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
