import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "terminal" | "bordered" | "panel" | "crt";
  padding?: "none" | "sm" | "md" | "lg";
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      glow = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = "transition-all duration-200 relative overflow-hidden";

    const variants = {
      default: "bg-terminal-secondary border border-terminal-border",
      terminal:
        "bg-black border border-terminal-fg/30 font-mono shadow-[0_0_20px_rgba(0,255,0,0.1)]",
      bordered: "bg-terminal-bg border border-terminal-border",
      panel:
        "bg-terminal-input border-l-2 border-l-terminal-accent border-y border-r border-terminal-border",
      crt: "bg-terminal-bg border border-terminal-border relative before:absolute before:inset-0 before:bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px)] before:bg-[length:100%_2px] before:pointer-events-none",
    };

    const paddings = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    const glowStyles = glow ? "shadow-[0_0_30px_rgba(16,185,129,0.15)]" : "";

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          glowStyles,
          className,
        )}
        ref={ref}
        {...props}
      >
        {variant === "terminal" && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terminal-fg/50 to-transparent" />
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 pb-3 border-b border-terminal-border/50",
      className,
    )}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-sm font-mono font-semibold uppercase tracking-wider text-terminal-accent flex items-center gap-2",
      className,
    )}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs font-mono text-terminal-muted", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("pt-3 font-mono text-sm", className)}
    {...props}
  />
));

CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-3 border-t border-terminal-border/50 text-xs font-mono",
      className,
    )}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";
