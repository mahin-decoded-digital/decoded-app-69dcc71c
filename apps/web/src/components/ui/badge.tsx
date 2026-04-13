import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function badgeVariants(variant: BadgeProps["variant"]) {
  switch (variant) {
    case "secondary":
      return "bg-slate-800 text-slate-200";
    case "destructive":
      return "bg-red-600 text-white";
    case "outline":
      return "border border-slate-700 text-slate-200";
    case "default":
    default:
      return "bg-indigo-600 text-white";
  }
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants(variant),
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };