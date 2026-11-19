import React from "react";
import { CheckIcon } from "./icons";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const boxSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      size = "md",
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2",
          disabled && "cursor-not-allowed opacity-40",
          className,
        )}
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              "block rounded-[3px] border border-line-strong bg-surface transition-colors duration-150 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas",
              boxSizes[size],
            )}
          />
          <CheckIcon
            aria-hidden
            className="pointer-events-none absolute h-2.5 w-2.5 text-on-primary opacity-0 peer-checked:opacity-100"
          />
        </span>
        {label ? (
          <span className="text-[12.5px] leading-[1.35] text-ink-2 select-none">
            {label}
          </span>
        ) : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
