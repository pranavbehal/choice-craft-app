import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
}

function Skeleton({
  className,
  "aria-label": ariaLabel,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      role="status"
      aria-label={ariaLabel || "Loading content"}
      aria-live="polite"
      {...props}
    />
  );
}

export { Skeleton };
