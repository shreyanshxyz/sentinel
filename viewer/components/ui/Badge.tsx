import React from "react";
import { cn } from "../../lib/utils";
import { LogLevel } from "@/types/log";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "log-level"
    | "terminal"
    | "status";
  size?: "sm" | "md" | "lg";
  level?: LogLevel;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      level,
      pulse = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center font-mono font-medium transition-all duration-150";

    const variants = {
      default:
        "bg-terminal-input text-terminal-accent border border-terminal-accent/40",
      secondary:
        "bg-terminal-border/50 text-text-secondary border border-terminal-border",
      outline:
        "border border-dashed border-terminal-border text-terminal-muted",
      terminal:
        "bg-black text-terminal-fg border border-terminal-fg/40 shadow-[0_0_8px_rgba(0,255,0,0.2)]",
      status:
        "bg-terminal-input text-text-primary border-l-2 border-l-terminal-accent",
      "log-level": "",
    };

    const sizes = {
      sm: "px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
      md: "px-2 py-0.5 text-xs uppercase tracking-wider",
      lg: "px-3 py-1 text-sm",
    };

    const logLevelStyles = level
      ? {
          DEBUG: "bg-log-debug/10 text-log-debug border border-log-debug/40",
          INFO: "bg-log-info/10 text-log-info border border-log-info/40",
          WARN: "bg-log-warn/10 text-log-warn border border-log-warn/40",
          ERROR: "bg-log-error/10 text-log-error border border-log-error/40",
          FATAL:
            "bg-log-fatal/20 text-log-fatal border border-log-fatal/50 animate-pulse",
        }[level]
      : "";

    const pulseStyles = pulse ? "animate-pulse" : "";

    return (
      <span
        className={cn(
          baseStyles,
          variant === "log-level" ? logLevelStyles : variants[variant],
          sizes[size],
          pulseStyles,
          className,
        )}
        ref={ref}
        {...props}
      >
        {variant === "terminal" && (
          <span className="mr-1.5 w-1.5 h-1.5 bg-terminal-fg rounded-full animate-pulse" />
        )}
        {variant === "status" && (
          <span className="mr-1.5 text-terminal-accent">●</span>
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
