import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Page({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("page-grid", className)} {...props} />;
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn("ui-card", className)} {...props} />;
}

export function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-stack", className)} {...props} />;
}

export function Inline({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-inline", className)} {...props} />;
}

export function SplitPane({
  className,
  leftMin = 420,
  rightWidth = 360,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { leftMin?: number; rightWidth?: number }) {
  return (
    <div
      className={cn(className)}
      style={{
        display: "grid",
        gridTemplateColumns: `minmax(${leftMin}px, 1fr) ${rightWidth}px`,
        gap: "12px",
        ...style,
      } as CSSProperties}
      {...props}
    />
  );
}
