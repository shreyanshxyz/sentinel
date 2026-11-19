import React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const ringSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-[18px] w-[18px]",
};

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      className,
      size = "md",
      label,
      ...props
    },
    ref,
  ) => {
    const message = label;

    return (
      <div
        ref={ref}
        role="status"
        className={cn("inline-flex items-center gap-2", className)}
        {...props}
      >
        <span
          className={cn(
            "animate-spin rounded-full border-2 border-line border-t-ink",
            ringSizes[size],
          )}
        />
        {message ? (
          <span className="text-[11px] text-muted">{message}</span>
        ) : (
          <span className="sr-only">Loading</span>
        )}
      </div>
    );
  },
);

Spinner.displayName = "Spinner";

export { Spinner };
