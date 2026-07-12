import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const alertVariants = cva(
  "relative w-full rounded-lg border-l-[3px] p-4 text-sm",
  {
    variants: {
      variant: {
        default:     "border-l-border bg-muted text-foreground",
        destructive: "border-l-destructive bg-destructive/5 text-destructive dark:bg-destructive/10",
        warning:     "border-l-[#E8A33D] bg-[var(--warning-bg)] text-[var(--warning-text)]",
        success:     "border-l-[#2FA876] bg-[rgba(47,168,118,0.18)] text-[#1F8F63]",
        info:        "border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-400",
        // Backward-compat aliases
        error:       "border-l-destructive bg-destructive/5 text-destructive dark:bg-destructive/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Alert = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none", className)} {...props} />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
