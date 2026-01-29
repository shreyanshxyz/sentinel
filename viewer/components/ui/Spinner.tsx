import React from "react";
import { cn } from "../../lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "terminal" | "blocks" | "dots";
  text?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", variant = "default", text, ...props }, ref) => {
    const textSizes = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    };

    if (variant === "blocks") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-1", className)}
          {...props}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "bg-terminal-accent animate-pulse",
                size === "sm" && "w-1.5 h-3",
                size === "md" && "w-2 h-4",
                size === "lg" && "w-2.5 h-5",
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
          {text && (
            <span
              className={cn(
                "ml-2 font-mono text-terminal-muted",
                textSizes[size],
              )}
            >
              {text}
            </span>
          )}
        </div>
      );
    }

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-1", className)}
          {...props}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "rounded-full bg-terminal-accent animate-bounce",
                size === "sm" && "w-1 h-1",
                size === "md" && "w-1.5 h-1.5",
                size === "lg" && "w-2 h-2",
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
          {text && (
            <span
              className={cn(
                "ml-2 font-mono text-terminal-muted",
                textSizes[size],
              )}
            >
              {text}
            </span>
          )}
        </div>
      );
    }

    const ringVariants = {
      default: "border-terminal-muted border-t-terminal-accent",
      terminal:
        "border-terminal-border border-t-terminal-fg shadow-[0_0_10px_rgba(0,255,0,0.3)]",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div
          className={cn(
            "animate-spin border-2",
            size === "sm" && "w-4 h-4",
            size === "md" && "w-6 h-6",
            size === "lg" && "w-8 h-8",
            variant === "terminal"
              ? "border-terminal-fg/30 border-t-terminal-fg"
              : ringVariants[variant],
          )}
        />
        {text && (
          <span
            className={cn("font-mono text-terminal-muted", textSizes[size])}
          >
            {text}
          </span>
        )}
      </div>
    );
  },
);

Spinner.displayName = "Spinner";

export { Spinner };
