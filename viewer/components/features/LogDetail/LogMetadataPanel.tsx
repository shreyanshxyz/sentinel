"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { LevelLabel } from "@/components/ui/LevelLabel";
import { useSettings } from "@/providers/SettingsProvider";
import { formatTimestamp } from "@/lib/format";
import { LogEntry } from "@/types/log";

export interface LogMetadataPanelProps {
  log: LogEntry;
  className?: string;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[10px] font-semibold tracking-[.08em] text-faint uppercase">
      {children}
    </h2>
  );
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function LogMetadataPanel({ log, className }: LogMetadataPanelProps) {
  const settings = useSettings();

  const attributes = useMemo(() => {
    const rows: Array<{ key: string; value: string }> = [];

    for (const [key, value] of Object.entries(log.labels ?? {})) {
      rows.push({ key, value: String(value) });
    }

    for (const [key, value] of Object.entries(log.metadata ?? {})) {
      if (value === undefined || value === null) continue;
      rows.push({ key: humanizeKey(key), value: String(value) });
    }

    return rows;
  }, [log]);

  return (
    <div className={className}>
      <section className="border-b border-line px-5 py-4">
        <SectionLabel>Event</SectionLabel>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <LevelLabel level={log.level} />
          <span
            title={formatTimestamp(log.timestamp, "iso", true)}
            className="font-mono text-[11px] text-muted tabular-nums"
          >
            {formatTimestamp(
              log.timestamp,
              settings.timestampFormat,
              settings.showMilliseconds,
            )}
          </span>
        </div>

        <p className="mt-2 max-w-[880px] font-mono text-[12.5px] leading-[1.55] break-words whitespace-pre-wrap text-ink">
          {log.message}
        </p>

        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-[10px] font-semibold tracking-[.06em] text-faint uppercase">
            Source
          </span>
          <span className="font-mono text-[11.5px] text-ink-2">
            {log.source}
          </span>
        </div>
      </section>

      <section className="border-b border-line px-5 py-4">
        <SectionLabel>Attributes</SectionLabel>

        {attributes.length === 0 ? (
          <p className="mt-2 text-[11.5px] text-muted">
            This event has no labels or system metadata.
          </p>
        ) : (
          <dl className="mt-1">
            {attributes.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[minmax(96px,180px)_minmax(0,1fr)] items-baseline gap-4 border-b border-line py-1.5 last:border-b-0"
              >
                <dt className="truncate font-mono text-[10.5px] text-faint">
                  {row.key}
                </dt>
                <dd className="font-mono text-[11.5px] break-words text-ink-2">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}

export default LogMetadataPanel;
