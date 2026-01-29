import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "terminal"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      glow = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-mono font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terminal-accent disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-terminal-input text-terminal-fg border border-terminal-border hover:border-terminal-accent hover:bg-terminal-border hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]",
      secondary:
        "bg-transparent text-text-secondary border border-terminal-border hover:text-text-primary hover:border-terminal-muted hover:bg-terminal-input",
      outline:
        "bg-transparent text-terminal-fg border border-dashed border-terminal-border hover:border-terminal-accent hover:text-terminal-accent",
      ghost:
        "bg-transparent text-text-muted hover:text-terminal-fg hover:bg-terminal-input",
      terminal:
        "bg-terminal-bg text-terminal-fg border border-terminal-fg hover:bg-terminal-fg hover:text-terminal-bg hover:shadow-[0_0_15px_rgba(0,255,0,0.4)]",
      danger:
        "bg-terminal-input text-log-error border border-log-error/50 hover:bg-log-error hover:text-terminal-bg hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]",
      success:
        "bg-terminal-input text-log-info border border-log-info/50 hover:bg-log-info hover:text-terminal-bg hover:shadow-[0_0_10px_rgba(6,182,212,0.4)]",
    };

    const sizes = {
      sm: "h-7 px-3 text-xs tracking-wider",
      md: "h-9 px-4 text-sm tracking-wide",
      lg: "h-11 px-6 text-base",
    };

    const glowStyles = glow ? "shadow-[0_0_8px_rgba(0,255,0,0.2)]" : "";

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glowStyles,
          className,
        )}
        ref={ref}
        {...props}
      >
        {variant === "terminal" && (
          <span className="mr-2 text-terminal-accent">{">"}</span>
        )}
        {children}
        {(variant === "primary" || variant === "terminal") && (
          <span className="ml-2 opacity-50 animate-pulse">_</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
