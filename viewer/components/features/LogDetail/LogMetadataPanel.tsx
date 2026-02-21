"use client";

import React from "react";
import { Badge } from "../../ui/Badge";
import { Card, CardHeader, CardTitle } from "../../ui/Card";
import { LogEntry } from "@/types/log";
import { cn } from "../../../lib/utils";

export interface LogMetadataPanelProps {
  log: LogEntry;
  className?: string;
}

export const LogMetadataPanel: React.FC<LogMetadataPanelProps> = ({
  log,
  className,
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      iso: date.toISOString(),
      local: date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
        hour12: false,
      }),
      relative: getRelativeTime(date),
    };
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const timeInfo = formatTimestamp(log.timestamp);

  return (
    <Card
      variant="bordered"
      padding="md"
      className={cn("space-y-4", className)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span className="text-terminal-accent">[</span>
          <span>METADATA</span>
          <span className="text-terminal-accent">]</span>
        </CardTitle>
      </CardHeader>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
          <span className="text-terminal-accent">[</span>
          <span>Timestamp</span>
          <span className="text-terminal-accent">]</span>
        </div>
        <div className="space-y-1 pl-3 border-l border-terminal-border/50">
          <div className="flex items-center gap-2">
            <span className="text-terminal-muted text-xs w-16">ISO:</span>
            <code className="text-sm text-text-primary font-mono">
              {timeInfo.iso}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-muted text-xs w-16">Local:</span>
            <code className="text-sm text-text-primary font-mono">
              {timeInfo.local}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-muted text-xs w-16">Relative:</span>
            <span className="text-sm text-terminal-accent font-mono">
              {timeInfo.relative}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
            <span className="text-terminal-accent">[</span>
            <span>Level</span>
            <span className="text-terminal-accent">]</span>
          </div>
          <div className="pl-3 border-l border-terminal-border/50">
            <Badge variant="log-level" level={log.level} size="md">
              {log.level}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
            <span className="text-terminal-accent">[</span>
            <span>Source</span>
            <span className="text-terminal-accent">]</span>
          </div>
          <div className="pl-3 border-l border-terminal-border/50">
            <code className="text-sm text-log-info font-mono">
              {log.source}
            </code>
          </div>
        </div>
      </div>

      {Object.keys(log.labels).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
            <span className="text-terminal-accent">[</span>
            <span>Labels</span>
            <span className="text-terminal-accent">]</span>
          </div>
          <div className="pl-3 border-l border-terminal-border/50 space-y-1">
            {Object.entries(log.labels).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-terminal-muted text-xs font-mono w-24">
                  {key}:
                </span>
                <span className="text-sm text-text-primary font-mono bg-terminal-input px-2 py-0.5 border border-terminal-border">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {log.metadata && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
            <span className="text-terminal-accent">[</span>
            <span>System Metadata</span>
            <span className="text-terminal-accent">]</span>
          </div>
          <div className="grid grid-cols-3 gap-3 pl-3 border-l border-terminal-border/50">
            {log.metadata.threadId !== undefined && (
              <div>
                <div className="text-terminal-muted text-[10px] font-mono uppercase mb-1">
                  Thread ID
                </div>
                <code className="text-sm text-text-primary font-mono">
                  {log.metadata.threadId}
                </code>
              </div>
            )}
            {log.metadata.pid !== undefined && (
              <div>
                <div className="text-terminal-muted text-[10px] font-mono uppercase mb-1">
                  PID
                </div>
                <code className="text-sm text-text-primary font-mono">
                  {log.metadata.pid}
                </code>
              </div>
            )}
            {log.metadata.serverId !== undefined && (
              <div>
                <div className="text-terminal-muted text-[10px] font-mono uppercase mb-1">
                  Server ID
                </div>
                <code className="text-sm text-text-primary font-mono">
                  {log.metadata.serverId}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default LogMetadataPanel;
