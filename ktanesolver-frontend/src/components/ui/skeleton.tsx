import { cn } from "../../lib/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-base-300 rounded-sm", className)}
      {...props}
    />
  );
}

export { Skeleton };
