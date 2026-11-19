import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      icon,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium text-ink-2"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {icon ? (
            <span className="pointer-events-none absolute top-1/2 left-2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center text-faint">
              {icon}
            </span>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "h-7 w-full rounded-[5px] border border-line bg-surface px-2 text-[12px] text-ink transition-colors duration-150 placeholder:text-faint hover:border-line-strong focus:border-ink disabled:cursor-not-allowed disabled:opacity-40",
              icon && "pl-7",
              error && "border-error",
              className,
            )}
            aria-invalid={error ? true : undefined}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-[11px] text-error">{error}</p>
        ) : hint ? (
          <p className="text-[11px] text-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
