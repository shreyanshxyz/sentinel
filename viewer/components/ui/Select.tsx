"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "terminal";
  className?: string;
  multiple?: boolean;
  searchable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select...",
  label,
  error,
  disabled = false,
  size = "md",
  variant = "terminal",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    value ?? defaultValue,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : selectedValue;
  const selectedOption = options.find((opt) => opt.value === currentValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (value === undefined) {
      setSelectedValue(optionValue);
    }
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const sizes = {
    sm: "h-7 text-xs",
    md: "h-9 text-sm",
    lg: "h-11 text-base",
  };

  const dropdownSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("space-y-1.5", className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-mono font-medium text-terminal-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 border bg-terminal-input font-mono transition-all duration-150",
            sizes[size],
            variant === "terminal" && [
              "border-terminal-fg/30 text-terminal-fg",
              "hover:border-terminal-fg/60",
              "focus:border-terminal-fg focus:outline-none",
              disabled && "opacity-40 cursor-not-allowed",
            ],
            variant === "default" && [
              "border-terminal-border text-text-primary",
              "hover:border-terminal-muted",
              "focus:border-terminal-accent focus:outline-none",
              disabled && "opacity-40 cursor-not-allowed",
            ],
            error && "border-log-error shadow-[0_0_8px_rgba(239,68,68,0.3)]",
          )}
        >
          <span
            className={cn("truncate", !selectedOption && "text-terminal-muted")}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <span
            className={cn(
              "ml-2 transition-transform duration-200",
              isOpen && "rotate-180",
              variant === "terminal"
                ? "text-terminal-fg"
                : "text-terminal-muted",
            )}
          >
            ▼
          </span>
        </button>

        {isOpen && (
          <div
            className={cn(
              "absolute z-50 w-full mt-1 border bg-terminal-input shadow-lg",
              variant === "terminal"
                ? "border-terminal-fg/30 shadow-[0_0_20px_rgba(0,255,0,0.1)]"
                : "border-terminal-border",
              dropdownSizes[size],
            )}
          >
            <div className="max-h-60 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-terminal-muted font-mono">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      "w-full px-3 py-2 text-left font-mono transition-colors",
                      variant === "terminal" && [
                        "text-terminal-fg hover:bg-terminal-fg/10",
                        currentValue === option.value &&
                          "bg-terminal-fg/20 border-l-2 border-l-terminal-fg",
                        option.disabled &&
                          "opacity-40 cursor-not-allowed hover:bg-transparent",
                      ],
                      variant === "default" && [
                        "text-text-primary hover:bg-terminal-border",
                        currentValue === option.value &&
                          "bg-terminal-accent/20 border-l-2 border-l-terminal-accent",
                        option.disabled &&
                          "opacity-40 cursor-not-allowed hover:bg-transparent",
                      ],
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {currentValue === option.value && (
                        <span
                          className={cn(
                            "text-xs",
                            variant === "terminal"
                              ? "text-terminal-fg"
                              : "text-terminal-accent",
                          )}
                        >
                          ▶
                        </span>
                      )}
                      {option.label}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-mono text-log-error flex items-center gap-1">
          <span className="text-log-error">!</span> {error}
        </p>
      )}
    </div>
  );
};

export default Select;
