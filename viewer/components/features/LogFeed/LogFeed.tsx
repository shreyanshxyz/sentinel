"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogEntry } from "@/types/log";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { cn } from "../../../lib/utils";

export interface LogFeedProps {
  logs?: LogEntry[];
  autoScroll?: boolean;
  className?: string;
  onLogClick?: (log: LogEntry) => void;
  onPauseChange?: (paused: boolean) => void;
  onClear?: () => void;
  isPaused?: boolean;
  navigateOnClick?: boolean;
}

export const LogFeed: React.FC<LogFeedProps> = ({
  logs = [],
  autoScroll = true,
  className,
  onLogClick,
  onPauseChange,
  onClear,
  isPaused: controlledIsPaused,
  navigateOnClick = false,
}) => {
  const [internalPaused, setInternalPaused] = useState(false);
  const [hoveredLog, setHoveredLog] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  const isPaused = controlledIsPaused ?? internalPaused;

  useEffect(() => {
    if (
      autoScroll &&
      !isPaused &&
      scrollContainerRef.current &&
      endOfLogsRef.current
    ) {
      endOfLogsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, isPaused]);

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
    const colors: Record<string, string> = {
      DEBUG: "text-log-debug",
      INFO: "text-log-info",
      WARN: "text-log-warn",
      ERROR: "text-log-error",
      FATAL: "text-log-fatal",
    };
    return colors[level as keyof typeof colors] || "text-text-primary";
  };

  const handlePauseToggle = () => {
    const newPaused = !isPaused;
    if (onPauseChange) {
      onPauseChange(newPaused);
    } else {
      setInternalPaused(newPaused);
    }
  };

  const handleClearLogs = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <Card variant="terminal" className={cn("h-full flex flex-col", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-fg/20 bg-terminal-input">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 bg-log-error" />
            <div className="w-2.5 h-2.5 bg-log-warn" />
            <div className="w-2.5 h-2.5 bg-terminal-accent" />
          </div>
          <span className="text-terminal-fg font-mono text-xs tracking-wide">
            sentinel@logs:~$ tail -f /var/log/system.log
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="terminal" size="sm">
            {logs.length} lines
          </Badge>
          <Button
            variant={isPaused ? "terminal" : "ghost"}
            size="sm"
            onClick={handlePauseToggle}
            glow={isPaused}
          >
            {isPaused ? "> RESUME" : "|| PAUSE"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearLogs}>
            [X] CLEAR
          </Button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto font-mono text-sm bg-black"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-terminal-muted">
            <div className="text-center">
              <div className="terminal-cursor text-terminal-fg text-lg mb-2">_</div>
              <p className="font-mono text-xs">WAITING FOR INPUT...</p>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            {logs.map((log) => {
              const logContent = (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-2 py-0.5 px-3 transition-colors border-l-2 border-transparent",
                    "hover:bg-terminal-input hover:border-terminal-accent",
                    hoveredLog === log.id &&
                      "bg-terminal-input border-terminal-accent",
                  )}
                  onMouseEnter={() => setHoveredLog(log.id)}
                  onMouseLeave={() => setHoveredLog(null)}
                  onClick={() => onLogClick?.(log)}
                >
                  <span className="text-terminal-muted font-mono text-[11px] whitespace-nowrap select-none shrink-0 w-18.75">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  <Badge
                    variant="log-level"
                    level={log.level}
                    size="sm"
                    className="shrink-0 w-11.25 justify-center"
                  >
                    {log.level.slice(0, 4)}
                  </Badge>

                  <span className="text-log-info font-mono text-[11px] whitespace-nowrap shrink-0 opacity-80">
                    {log.source}
                  </span>

                  <span
                    className={cn(
                      "flex-1 break-all text-xs leading-relaxed",
                      getLogLevelColor(log.level),
                    )}
                  >
                    {log.message}
                  </span>

                  {Object.keys(log.labels).length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {Object.entries(log.labels)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="text-[9px] text-terminal-muted bg-terminal-border/30 px-1.5 py-0.5 font-mono"
                          >
                            {key}={String(value)}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              );

              if (navigateOnClick) {
                return (
                  <Link key={log.id} href={`/logs/${log.id}`}>
                    {logContent}
                  </Link>
                );
              }

              return logContent;
            })}
            <div ref={endOfLogsRef} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-terminal-fg/20 bg-terminal-input">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "font-mono text-xs uppercase tracking-wider",
              isPaused ? "text-log-warn" : "text-terminal-accent",
            )}
          >
            {isPaused ? "◉ PAUSED" : "● LIVE"}
          </span>
          {!isPaused && (
            <span className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse" />
          )}
        </div>

        <div className="text-terminal-muted font-mono text-xs">
          {logs.length > 0
            ? `> ${formatTimestamp(logs[logs.length - 1]!.timestamp)}`
            : "--:--:--.---"}
        </div>
      </div>
    </Card>
  );
};

export default LogFeed;
