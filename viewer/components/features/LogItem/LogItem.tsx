"use client";

import React from "react";
import { LogEntry } from "@/types/log";
import { Badge } from "../../ui/Badge";
import { cn } from "../../../lib/utils";

export interface LogItemProps {
  log: LogEntry;
  onClick?: (log: LogEntry) => void;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
  showTimestamp?: boolean;
  showLevel?: boolean;
  showSource?: boolean;
  showLabels?: boolean;
  compact?: boolean;
}

export const LogItem: React.FC<LogItemProps> = ({
  log,
  onClick,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  className,
  showTimestamp = true,
  showLevel = true,
  showSource = true,
  showLabels = true,
  compact = false,
}) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const getLogLevelColor = (level: string) => {
    const colors = {
      DEBUG: "text-log-debug",
      INFO: "text-log-info",
      WARN: "text-log-warn",
      ERROR: "text-log-error",
      FATAL: "text-log-fatal",
    };
    return colors[level as keyof typeof colors] || "text-text-primary";
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 py-0.5 px-3 transition-colors cursor-pointer border-l-2 border-transparent",
        "hover:bg-terminal-input hover:border-terminal-accent",
        isHovered && "bg-terminal-input border-terminal-accent",
        compact && "py-0.5 px-2",
        className,
      )}
      onClick={() => onClick?.(log)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showTimestamp && (
        <span
          className={cn(
            "text-terminal-muted font-mono whitespace-nowrap select-none shrink-0",
            compact ? "text-[10px] w-16" : "text-[11px] w-18.75",
          )}
        >
          {formatTimestamp(log.timestamp)}
        </span>
      )}

      {showLevel && (
        <Badge
          variant="log-level"
          level={log.level}
          size={compact ? "sm" : "sm"}
          className="shrink-0 w-11.25 justify-center"
        >
          {log.level.slice(0, 4)}
        </Badge>
      )}

      {showSource && (
        <span
          className={cn(
            "text-log-info font-mono whitespace-nowrap shrink-0 opacity-80",
            compact ? "text-[10px]" : "text-[11px]",
          )}
        >
          {log.source}
        </span>
      )}

      <span
        className={cn(
          "flex-1 break-all leading-relaxed",
          compact ? "text-[11px]" : "text-xs",
          getLogLevelColor(log.level),
        )}
      >
        {log.message}
      </span>

      {showLabels && Object.keys(log.labels).length > 0 && (
        <div className="flex gap-1 shrink-0">
          {Object.entries(log.labels)
            .slice(0, compact ? 1 : 2)
            .map(([key, value]) => (
              <span
                key={key}
                className={cn(
                  "text-terminal-muted bg-terminal-border/30 px-1.5 py-0.5 font-mono",
                  compact ? "text-[8px]" : "text-[9px]",
                )}
              >
                {key}={String(value)}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default LogItem;
