"use client";

import React, { ReactNode } from "react";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  status?: {
    connected: boolean;
    logsPerSecond: number;
    totalLogs: number;
  };
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Sentinel",
  subtitle,
  actions,
  status,
  className,
}) => {
  return (
    <header
      className={cn(
        "border-b border-terminal-border bg-terminal-secondary",
        "px-6 py-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-terminal-fg font-mono tracking-wide">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {status && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    status.connected ? "bg-terminal-accent" : "bg-log-error",
                  )}
                />
                <span className="text-text-secondary">
                  {status.connected ? "Connected" : "Disconnected"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-text-muted">Logs/sec:</span>
                <Badge variant="log-level" level="INFO" size="sm">
                  {status.logsPerSecond}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-text-muted">Total:</span>
                <span className="text-text-primary font-mono">
                  {status.totalLogs.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {actions && (
            <div className="flex items-center space-x-2 border-l border-terminal-border pl-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
