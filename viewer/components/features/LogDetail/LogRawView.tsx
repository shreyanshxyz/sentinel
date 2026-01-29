"use client";

import React, { useState } from "react";
import { Button } from "../../ui/Button";
import { Card, CardHeader, CardTitle } from "../../ui/Card";
import { LogEntry } from "@/types/log";
import { cn } from "../../../lib/utils";

export interface LogRawViewProps {
  log: LogEntry;
  className?: string;
}

export const LogRawView: React.FC<LogRawViewProps> = ({ log, className }) => {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleCopy = async () => {
    const textToCopy = log.raw || JSON.stringify(log, null, 2);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      DEBUG: "text-log-debug",
      INFO: "text-log-info",
      WARN: "text-log-warn",
      ERROR: "text-log-error",
      FATAL: "text-log-fatal",
    };
    return colors[level] || "text-text-primary";
  };

  const rawContent = log.raw || JSON.stringify(log, null, 2);
  const lines = rawContent.split("\n");

  return (
    <Card
      variant="terminal"
      padding="none"
      className={cn("flex flex-col", className)}
    >
      <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-terminal-fg/20 bg-terminal-input">
        <CardTitle className="flex items-center gap-2">
          <span className="text-terminal-accent">[</span>
          <span>RAW LOG</span>
          <span className="text-terminal-accent">]</span>
        </CardTitle>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
          >
            <span className="text-terminal-muted">[</span>
            <span>{showLineNumbers ? "HIDE LINES" : "SHOW LINES"}</span>
            <span className="text-terminal-muted">]</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <span className="text-terminal-muted">[</span>
            <span>{copied ? "COPIED!" : "COPY"}</span>
            <span className="text-terminal-muted">]</span>
          </Button>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-auto bg-black p-4 font-mono text-sm">
        <pre className="whitespace-pre-wrap break-all">
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                "flex hover:bg-terminal-input/50 transition-colors",
                getLogLevelColor(log.level),
              )}
            >
              {showLineNumbers && (
                <span className="text-terminal-muted select-none pr-4 text-xs border-r border-terminal-border/30 w-12 text-right">
                  {index + 1}
                </span>
              )}
              <span className="flex-1">{line}</span>
            </div>
          ))}
        </pre>
      </div>

      <div className="px-4 py-2 border-t border-terminal-fg/20 bg-terminal-input flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-terminal-muted">
            Lines: <span className="text-text-primary">{lines.length}</span>
          </span>
          <span className="text-terminal-muted">
            Chars:{" "}
            <span className="text-text-primary">{rawContent.length}</span>
          </span>
        </div>
        <div className="text-terminal-muted">
          Format: <span className="text-terminal-accent">RAW</span>
        </div>
      </div>
    </Card>
  );
};

export default LogRawView;
