import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Tabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-tabs", className)} {...props} />;
}

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function TabButton({ className, active = false, ...props }: TabButtonProps) {
  return <button className={cn("ui-tab", className)} aria-pressed={active} {...props} />;
}
