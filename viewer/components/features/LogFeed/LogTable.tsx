"use client";

import type { LogEntry } from "@/types/log";
import type { ReactNode } from "react";
import { LevelLabel } from "@/components/ui/LevelLabel";
import { Tag } from "@/components/ui/Tag";
import { useSettings } from "@/providers/SettingsProvider";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface LogTableProps {
  logs: LogEntry[];
  onRowClick?: ((log: LogEntry) => void) | undefined;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

export function LogTable({
  logs,
  onRowClick,
  loading = false,
  emptyState,
  className,
}: LogTableProps) {
  const settings = useSettings();

  return (
    <table
      className={cn("w-full table-fixed border-collapse", className)}
      aria-label="Log events"
    >
      <colgroup>
        <col style={{ width: settings.timestampFormat === "iso" ? 172 : 96 }} />
        <col style={{ width: 64 }} />
        <col style={{ width: 116 }} />
        <col />
        <col style={{ width: 150 }} />
      </colgroup>

      <thead className="sticky top-0 z-10 bg-sunken">
        <tr>
          <th className="h-[27px] border-b border-line px-3 text-left text-[10px] font-semibold tracking-[.07em] whitespace-nowrap text-faint uppercase">
            Time
          </th>
          <th className="h-[27px] border-b border-line px-3 text-left text-[10px] font-semibold tracking-[.07em] whitespace-nowrap text-faint uppercase">
            Level
          </th>
          <th className="h-[27px] border-b border-line px-3 text-left text-[10px] font-semibold tracking-[.07em] whitespace-nowrap text-faint uppercase">
            Source
          </th>
          <th className="h-[27px] border-b border-line px-3 text-left text-[10px] font-semibold tracking-[.07em] whitespace-nowrap text-faint uppercase">
            Message
          </th>
          <th className="h-[27px] border-b border-line px-3 text-right text-[10px] font-semibold tracking-[.07em] whitespace-nowrap text-faint uppercase">
            Labels
          </th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td colSpan={5} className="p-0">
                <div className="h-[34px] border-b border-line bg-sunken" />
              </td>
            </tr>
          ))
        ) : logs.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="h-[120px] px-4 text-center align-middle text-[12px] text-muted"
            >
              {emptyState ?? "No events."}
            </td>
          </tr>
        ) : (
          logs.map((log) => {
            const labelEntries = Object.entries(log.labels ?? {});
            const visibleLabels = labelEntries.slice(0, 2);
            const extraLabels = labelEntries.length - visibleLabels.length;

            return (
              <tr
                key={log.id}
                tabIndex={0}
                onClick={() => onRowClick?.(log)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick?.(log);
                  }
                }}
                className={cn(
                  "h-[34px] border-b border-line transition-colors duration-100 hover:bg-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent focus-visible:outline-none",
                  onRowClick && "cursor-pointer",
                )}
              >
                <td className="log-meta overflow-hidden px-2 font-mono whitespace-nowrap text-faint tabular-nums">
                  <span
                    title={formatTimestamp(
                      log.timestamp,
                      "iso",
                      settings.showMilliseconds,
                    )}
                  >
                    {formatTimestamp(
                      log.timestamp,
                      settings.timestampFormat,
                      settings.showMilliseconds,
                    )}
                  </span>
                </td>
                <td className="overflow-hidden px-3 whitespace-nowrap">
                  <LevelLabel level={log.level} />
                </td>
                <td className="overflow-hidden px-3">
                  <span
                    title={log.source}
                    className="log-meta block truncate text-muted"
                  >
                    {log.source}
                  </span>
                </td>
                <td className="overflow-hidden px-3">
                  <span className="log-text block truncate font-mono tracking-[-0.02em] text-ink-2">
                    {log.message}
                  </span>
                </td>
                <td className="overflow-hidden px-3">
                  {labelEntries.length > 0 ? (
                    <div className="flex items-center justify-end gap-1 overflow-hidden">
                      {visibleLabels.map(([key, value]) => (
                        <Tag key={key} title={`${key}=${value}`}>
                          {`${key}=${String(value)}`}
                        </Tag>
                      ))}
                      {extraLabels > 0 ? (
                        <span className="font-mono text-[9px] whitespace-nowrap text-faint">
                          +{extraLabels}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export default LogTable;
