import React from "react";
import { cn } from "../../lib/utils";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label?: React.ReactNode;
  variant?: "default" | "terminal" | "bracket";
  size?: "sm" | "md" | "lg";
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, variant = "terminal", size = "md", ...props }, ref) => {
    const sizes = {
      sm: "w-3.5 h-3.5 text-[8px]",
      md: "w-4 h-4 text-[10px]",
      lg: "w-5 h-5 text-xs",
    };

    const labelSizes = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    };

    return (
      <label
        className={cn(
          "flex items-center gap-2 cursor-pointer group",
          className,
        )}
      >
        <div className="relative">
          <input type="checkbox" ref={ref} className="sr-only" {...props} />
          {variant === "terminal" && (
            <div
              className={cn(
                "flex items-center justify-center border transition-all duration-150",
                sizes[size],
                "bg-terminal-input border-terminal-border group-hover:border-terminal-muted",
                props.checked
                  ? "bg-terminal-accent/20 border-terminal-accent text-terminal-accent shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : "text-transparent",
              )}
            >
              {props.checked && "✓"}
            </div>
          )}
          {variant === "bracket" && (
            <div
              className={cn(
                "flex items-center justify-center font-mono transition-all duration-150 whitespace-nowrap",
                sizes[size],
                props.checked
                  ? "text-terminal-accent"
                  : "text-terminal-muted group-hover:text-text-secondary",
              )}
            >
              {props.checked ? "[X]" : "[\u00A0]"}
            </div>
          )}
          {variant === "default" && (
            <div
              className={cn(
                "flex items-center justify-center border transition-all duration-150",
                sizes[size],
                "bg-terminal-input border-terminal-border group-hover:border-terminal-accent",
                props.checked
                  ? "bg-terminal-accent border-terminal-accent text-terminal-bg"
                  : "text-transparent",
              )}
            >
              {props.checked && "✓"}
            </div>
          )}
        </div>
        {label && (
          <span
            className={cn(
              "font-mono select-none transition-colors",
              labelSizes[size],
              props.disabled
                ? "text-terminal-muted"
                : "text-text-primary group-hover:text-terminal-accent",
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
