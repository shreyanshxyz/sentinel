"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
  hint?: string | undefined;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-6 px-2 text-[11px]",
  md: "h-7 px-2 text-[12px]",
  lg: "h-8 px-2.5 text-[12.5px]",
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Select…",
      label,
      error,
      hint,
      disabled = false,
      size = "md",
      className,
    },
    forwardedRef,
  ) => {
    const [internalValue, setInternalValue] = useState<string | undefined>(
      value ?? defaultValue,
    );
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxId = useId();

    const currentValue = value !== undefined ? value : internalValue;
    const selectedIndex = options.findIndex(
      (option) => option.value === currentValue,
    );
    const selectedOption =
      selectedIndex >= 0 ? options[selectedIndex] : undefined;

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const setTriggerRef = (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const openMenu = () => {
      if (disabled) return;
      setIsOpen(true);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    };

    const closeMenu = (restoreFocus = false) => {
      setIsOpen(false);
      if (restoreFocus) triggerRef.current?.focus();
    };

    const selectOption = (option: SelectOption) => {
      if (option.disabled) return;
      if (value === undefined) setInternalValue(option.value);
      onChange?.(option.value);
      closeMenu(true);
    };

    const moveActive = (direction: 1 | -1) => {
      if (options.length === 0) return;
      let next = activeIndex;
      for (let step = 0; step < options.length; step += 1) {
        next = (next + direction + options.length) % options.length;
        if (!options[next]?.disabled) {
          setActiveIndex(next);
          return;
        }
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (
          event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openMenu();
        }
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActive(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const active = options[activeIndex];
        if (active) selectOption(active);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      } else if (event.key === "Tab") {
        closeMenu();
      }
    };

    return (
      <div className={cn("space-y-1.5", className)}>
        {label ? (
          <span className="block text-[11px] font-medium text-ink-2">
            {label}
          </span>
        ) : null}

        <div className="relative" ref={containerRef}>
          <button
            ref={setTriggerRef}
            type="button"
            disabled={disabled}
            onClick={() => (isOpen ? closeMenu() : openMenu())}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            data-invalid={error ? true : undefined}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between gap-2 rounded-[5px] border border-line bg-surface text-left text-ink transition-colors duration-150 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40",
              sizeStyles[size],
              error && "border-error",
            )}
          >
            <span
              className={cn(
                "truncate",
                selectedOption ? "text-ink" : "text-faint",
              )}
            >
              {selectedOption?.label ?? placeholder}
            </span>
            <ChevronDownIcon
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-faint transition-transform duration-150",
                isOpen && "rotate-180",
              )}
            />
          </button>

          {isOpen ? (
            <div
              id={listboxId}
              role="listbox"
              className="absolute right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-[5px] border border-line bg-surface py-1 shadow-[0_8px_24px_-16px_rgb(0_0_0/.35)]"
            >
              {options.length === 0 ? (
                <div className="px-2.5 py-2 text-[12px] text-muted">
                  No options
                </div>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === currentValue;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectOption(option)}
                      className={cn(
                        "relative flex h-7 w-full cursor-pointer items-center justify-between gap-3 px-2.5 text-left text-[12px] transition-colors duration-100",
                        option.disabled && "cursor-not-allowed opacity-40",
                        isSelected ? "bg-selected text-ink" : "text-ink-2",
                        !option.disabled && !isSelected && "hover:bg-hover",
                        isActive && !option.disabled && "bg-hover",
                      )}
                    >
                      {isSelected ? (
                        <span
                          aria-hidden
                          className="absolute top-0 left-0 h-full w-[3px] bg-ink"
                        />
                      ) : null}
                      <span className="truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="shrink-0 font-mono text-[10.5px] text-faint tabular-nums">
                          {option.hint}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
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

Select.displayName = "Select";

export default Select;
