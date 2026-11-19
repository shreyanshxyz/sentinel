"use client";

import type { LogLevel } from "@/types/log";
import { useSettings } from "@/providers/SettingsProvider";
import { cn } from "@/lib/utils";

const levelColors: Record<LogLevel, string> = {
  DEBUG: "text-debug",
  INFO: "text-info",
  WARN: "text-warn",
  ERROR: "text-error",
  FATAL: "text-fatal",
};

export interface LevelLabelProps {
  level: LogLevel;
  colorize?: boolean | undefined;
  className?: string;
}

export function LevelLabel({
  level,
  colorize,
  className,
}: LevelLabelProps) {
  const settings = useSettings();
  const colored = colorize ?? settings.colorizeLevels;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[.03em] whitespace-nowrap",
        colored ? levelColors[level] : "text-ink-2",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-[5px] w-[5px] rounded-full",
          colored ? "bg-current" : "bg-ink-2",
        )}
      />
      {level}
    </span>
  );
}

export default LevelLabel;
