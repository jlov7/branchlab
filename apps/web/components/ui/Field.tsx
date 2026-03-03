import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldProps extends HTMLAttributes<HTMLLabelElement> {
  label: string;
  help?: string;
  htmlFor?: string;
}

export function Field({ label, help, className, children, ...props }: FieldProps) {
  return (
    <label className={cn("ui-field", className)} {...props}>
      <span className="ui-field-label">{label}</span>
      {children}
      {help ? <span className="ui-field-help">{help}</span> : null}
    </label>
  );
}
