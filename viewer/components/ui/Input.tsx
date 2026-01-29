import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: "default" | "terminal" | "command";
  prompt?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      icon,
      variant = "default",
      prompt = ">",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "flex w-full border bg-terminal-input text-text-primary placeholder:text-text-muted/50 transition-all duration-150 focus-visible:outline-none focus-visible:border-terminal-accent disabled:cursor-not-allowed disabled:opacity-40 font-mono text-sm tracking-wide";

    const variants = {
      default:
        "border-terminal-border hover:border-terminal-muted focus:border-terminal-accent",
      terminal:
        "border-terminal-fg/30 bg-black text-terminal-fg focus:border-terminal-fg shadow-[inset_0_0_10px_rgba(0,255,0,0.05)]",
      command:
        "border-terminal-accent/50 bg-terminal-bg text-terminal-accent focus:border-terminal-accent pl-8",
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-mono font-medium text-terminal-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative group">
          {variant === "command" && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-accent font-mono text-sm animate-pulse">
              {prompt}
            </span>
          )}
          {icon && variant !== "command" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-muted group-focus-within:text-terminal-accent transition-colors">
              {icon}
            </div>
          )}
          <input
            className={cn(
              baseStyles,
              variants[variant],
              icon && variant !== "command" && "pl-10",
              error &&
                "border-log-error focus:border-log-error shadow-[0_0_8px_rgba(239,68,68,0.3)]",
              "h-9 px-3",
              className,
            )}
            ref={ref}
            {...props}
          />
          {variant === "terminal" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-4 bg-terminal-fg/50 animate-pulse" />
          )}
        </div>
        {error && (
          <p className="text-xs font-mono text-log-error flex items-center gap-1">
            <span className="text-log-error">!</span> {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
