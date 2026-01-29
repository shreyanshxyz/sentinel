"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { LogLevel } from "@/types/log";
import { cn } from "../../../lib/utils";

export interface LogDetailHeaderProps {
  logId: string;
  logLevel?: LogLevel;
  onCopyRaw?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  className?: string;
}

export const LogDetailHeader: React.FC<LogDetailHeaderProps> = ({
  logId,
  logLevel,
  onCopyRaw,
  onShare,
  onExport,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(logId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level?: string) => {
    if (!level) return "text-terminal-muted";
    const colors: Record<string, string> = {
      DEBUG: "text-log-debug",
      INFO: "text-log-info",
      WARN: "text-log-warn",
      ERROR: "text-log-error",
      FATAL: "text-log-fatal",
    };
    return colors[level] || "text-terminal-muted";
  };

  return (
    <header
      className={cn(
        "border-b border-terminal-border bg-terminal-secondary",
        "px-6 py-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="text-terminal-accent">◀</span>
              <span>BACK</span>
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-terminal-muted font-mono text-xs">
                LOG ID:
              </span>
              <code
                className={cn(
                  "font-mono text-sm bg-terminal-input px-2 py-1 border border-terminal-border cursor-pointer hover:border-terminal-accent transition-colors",
                  getLevelColor(logLevel),
                )}
                onClick={handleCopyId}
                title="Click to copy"
              >
                {logId}
              </code>
              {copied && (
                <span className="text-terminal-accent text-xs font-mono animate-pulse">
                  COPIED
                </span>
              )}
            </div>

            {logLevel && (
              <Badge variant="log-level" level={logLevel} size="sm">
                {logLevel}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCopyRaw}>
            <span className="text-terminal-muted">[</span>
            <span>COPY RAW</span>
            <span className="text-terminal-muted">]</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare}>
            <span className="text-terminal-muted">[</span>
            <span>SHARE</span>
            <span className="text-terminal-muted">]</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport}>
            <span className="text-terminal-muted">[</span>
            <span>EXPORT</span>
            <span className="text-terminal-muted">]</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LogDetailHeader;
