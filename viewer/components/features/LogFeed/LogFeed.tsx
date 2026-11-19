"use client";

import React, { useEffect, useRef } from "react";
import type { LogEntry } from "@/types/log";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { LogTable } from "./LogTable";
import { cn } from "@/lib/utils";

export interface LogFeedProps {
  logs: LogEntry[];
  isPaused: boolean;
  isConnected: boolean;
  streamError: Error | null;
  totalBuffered: number;
  lastEventAt?: string | undefined;
  onLogClick?: (log: LogEntry) => void;
  onClear: () => void;
  onRetry: () => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

export function LogFeed({
  logs,
  isPaused,
  isConnected,
  streamError,
  totalBuffered,
  lastEventAt,
  onLogClick,
  onClear,
  onRetry,
  loading = false,
  emptyState,
  className,
}: LogFeedProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);
  const newestId = logs[logs.length - 1]?.id;

  useEffect(() => {
    if (isPaused || !scrollContainerRef.current || !endOfLogsRef.current) {
      return;
    }
    endOfLogsRef.current.scrollIntoView({ behavior: "smooth" });
  }, [newestId, isPaused]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col border-t border-line",
        className,
      )}
    >
      {!isConnected || streamError ? (
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-sunken px-5 py-2 text-[11.5px] text-muted">
          <span className="min-w-0 flex-1 truncate">
            {streamError
              ? `Live stream unavailable — ${streamError.message.toLowerCase()}. Showing the last loaded events.`
              : "Live stream unavailable — showing the last 100 events."}
          </span>
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <LogTable
          logs={logs}
          onRowClick={onLogClick}
          loading={loading}
          emptyState={emptyState}
        />
        <div ref={endOfLogsRef} />
      </div>

      <div className="flex h-[30px] shrink-0 items-center gap-2 border-t border-line px-5 text-[10.5px] text-faint">
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isPaused ? "bg-muted" : "bg-ok",
            !isPaused && "live-dot",
          )}
        />
        <span>{isPaused ? "Paused" : "Streaming"}</span>
        <span aria-hidden className="text-line">
          ·
        </span>
        <span className="truncate">
          Updated {lastEventAt ? <RelativeTime iso={lastEventAt} /> : "—"}
        </span>
        <span className="ml-auto whitespace-nowrap tabular-nums">
          {totalBuffered.toLocaleString()} in buffer
        </span>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export default LogFeed;
