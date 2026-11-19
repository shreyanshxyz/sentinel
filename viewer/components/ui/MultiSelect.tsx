"use client";

import { useEffect, useRef, useState } from "react";
import { Checkbox } from "./Checkbox";
import { ChevronDownIcon } from "./icons";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
}

export interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  values,
  onChange,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const close = (restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const toggleValue = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            close(true);
          }
        }}
        className={cn(
          "flex h-7 cursor-pointer items-center gap-1.5 rounded-[5px] border border-line bg-surface px-2 text-[11.5px] text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          isOpen && "border-line-strong",
        )}
      >
        <span className="text-muted">{label}</span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span className="tabular-nums">
          {values.length > 0 ? values.length : "Any"}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-3.5 w-3.5 text-faint transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute left-0 z-50 mt-1 w-60 rounded-[5px] border border-line bg-surface shadow-[0_8px_24px_-16px_rgb(0_0_0/.35)]"
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-2.5 py-2 text-[12px] text-muted">
                No options
              </div>
            ) : (
              options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center justify-between gap-3 px-2.5 py-1.5 hover:bg-hover"
                >
                  <Checkbox
                    checked={values.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                    label={option.label}
                    size="sm"
                  />
                  {option.hint ? (
                    <span className="font-mono text-[10.5px] text-faint tabular-nums">
                      {option.hint}
                    </span>
                  ) : null}
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end border-t border-line p-1.5">
            <button
              type="button"
              disabled={values.length === 0}
              onClick={() => onChange([])}
              className="cursor-pointer rounded-[3px] px-1.5 py-0.5 text-[11px] text-muted transition-colors duration-150 hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MultiSelect;
