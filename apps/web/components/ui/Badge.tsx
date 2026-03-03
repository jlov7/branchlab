import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "default" | "success" | "warning" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "ui-badge",
        tone === "success" && "ui-badge-success",
        tone === "warning" && "ui-badge-warning",
        tone === "danger" && "ui-badge-danger",
        className,
      )}
      {...props}
    />
  );
}
