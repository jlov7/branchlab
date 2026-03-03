import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "default" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "default", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "ui-button",
        variant === "primary" && "ui-button-primary",
        variant === "danger" && "ui-button-danger",
        variant === "ghost" && "ui-button-ghost",
        className,
      )}
      {...props}
    />
  );
}
