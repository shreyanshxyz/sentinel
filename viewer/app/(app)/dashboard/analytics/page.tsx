"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { LevelLabel } from "@/components/ui/LevelLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useAnalytics, useHealth } from "@/hooks/useQueries";
import { APIError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { LogLevel } from "@/types/log";

type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

const RANGE_MINUTES: Record<TimeRange, number> = {
  "1h": 60,
  "6h": 6 * 60,
  "24h": 24 * 60,
  "7d": 7 * 24 * 60,
  "30d": 30 * 24 * 60,
};

const LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

const LEVEL_BAR: Record<LogLevel, string> = {
  DEBUG: "bg-debug/60",
  INFO: "bg-info/70",
  WARN: "bg-warn/80",
  ERROR: "bg-error/80",
  FATAL: "bg-fatal",
};

function Metric({
  label,
  value,
  note,
  tone,
  loading,
}: {
  label: string;
  value: string;
  note?: string | undefined;
  tone?: "error" | "warn" | undefined;
  loading?: boolean | undefined;
}) {
  return (
    <div className="min-w-0 flex-1 border-l border-line px-4 py-2.5 first:border-l-0">
      <div className="text-[10px] font-semibold tracking-[.08em] text-faint uppercase">
        {label}
      </div>
      {loading ? (
        <div className="mt-2 h-[23px] w-16 rounded-[2px] bg-sunken" />
      ) : (
        <div
          className={cn(
            "mt-1 flex items-baseline gap-2 text-[21px] leading-[1.1] font-semibold tabular-nums",
            tone === "error" && "text-error",
            tone === "warn" && "text-warn",
            !tone && "text-ink",
          )}
        >
          {value}
          {note ? (
            <span className="text-[10.5px] font-normal text-faint">{note}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SectionHead({
  title,
  caption,
}: {
  title: string;
  caption?: string | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-[7px]">
      <h2 className="text-[11px] font-semibold tracking-[.04em] text-ink">
        {title}
      </h2>
      {caption ? (
        <span className="text-[10.5px] text-faint">{caption}</span>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>("24h");

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useAnalytics(range, true);

  const { data: healthData } = useHealth({ refetchInterval: 30000 });

  const stats = useMemo(() => {
    const byLevel = analyticsData?.byLevel ?? {};
    const bySource = analyticsData?.bySource ?? {};
    const total = analyticsData?.total ?? 0;

    const good = (byLevel.DEBUG ?? 0) + (byLevel.INFO ?? 0);
    const bad =
      (byLevel.WARN ?? 0) + (byLevel.ERROR ?? 0) + (byLevel.FATAL ?? 0);
    const avgPerMinute = Math.round(total / RANGE_MINUTES[range]);

    return { total, good, bad, byLevel, bySource, avgPerMinute };
  }, [analyticsData, range]);

  const currentRate = healthData?.metrics?.logsPerSecond;

  const share = (count: number) =>
    stats.total > 0 ? (count / stats.total) * 100 : 0;

  const sourceRows = useMemo(
    () =>
      Object.entries(stats.bySource).sort(
        ([, a], [, b]) => b - a,
      ) as [string, number][],
    [stats.bySource],
  );

  const errorMessage = error
    ? error instanceof APIError
      ? error.message
      : "Failed to load analytics."
    : null;

  const lastUpdated =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour12: false })
      : "—";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHead
        title="Analytics"
        subtitle="Log volume and level mix"
        actions={
          <SegmentedControl
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            ariaLabel="Analytics time range"
          />
        }
      />

      {errorMessage ? (
        <div className="flex items-center gap-3 border-b border-line bg-sunken px-5 py-2 text-[11.5px] text-error">
          <span className="min-w-0 flex-1 truncate">{errorMessage}</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="flex border-b border-line">
        <Metric
          label="Total"
          value={stats.total.toLocaleString()}
          loading={isLoading}
        />
        <Metric
          label="Good"
          value={stats.good.toLocaleString()}
          note={stats.total > 0 ? `${share(stats.good).toFixed(1)}%` : undefined}
          loading={isLoading}
        />
        <Metric
          label="Bad"
          value={stats.bad.toLocaleString()}
          note={stats.total > 0 ? `${share(stats.bad).toFixed(1)}%` : undefined}
          tone={stats.bad > 0 ? "error" : undefined}
          loading={isLoading}
        />
        <Metric
          label="Avg / min"
          value={stats.avgPerMinute.toLocaleString()}
          loading={isLoading}
        />
        <Metric
          label="Current rate"
          value={
            currentRate !== undefined ? Math.round(currentRate * 60).toLocaleString() : "—"
          }
          note="/ min"
          loading={isLoading}
        />
      </div>

      <section className="border-b border-line pb-2">
        <SectionHead
          title="By level"
          caption={`${stats.total.toLocaleString()} records in range`}
        />
        <div className="px-5">
          {isLoading
            ? LEVELS.map((level) => (
                <div
                  key={level}
                  className="flex h-[34px] items-center gap-3 border-b border-line last:border-b-0"
                >
                  <div className="h-2.5 w-14 rounded-[2px] bg-sunken" />
                  <div className="h-[6px] flex-1 rounded-[2px] bg-sunken" />
                </div>
              ))
            : LEVELS.map((level) => {
                const count = stats.byLevel[level] ?? 0;
                const percent = share(count);

                return (
                  <div
                    key={level}
                    className="grid h-[34px] grid-cols-[76px_70px_52px_1fr] items-center gap-3 border-b border-line last:border-b-0"
                  >
                    <LevelLabel level={level} />
                    <span className="font-mono text-[10.5px] text-ink-2 tabular-nums">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-right font-mono text-[10.5px] text-faint tabular-nums">
                      {percent.toFixed(1)}%
                    </span>
                    <div className="h-[6px] overflow-hidden rounded-[2px] bg-sunken">
                      <div
                        className={cn("h-full rounded-[2px]", LEVEL_BAR[level])}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      <section className="border-b border-line pb-3">
        <SectionHead
          title="By source"
          caption={`${sourceRows.length} ${
            sourceRows.length === 1 ? "source" : "sources"
          }`}
        />
        <div className="px-5 pt-1">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-[34px] items-center gap-3 border-b border-line"
                >
                  <div className="h-2.5 w-32 rounded-[2px] bg-sunken" />
                  <div className="ml-auto h-2.5 w-10 rounded-[2px] bg-sunken" />
                </div>
              ))}
            </div>
          ) : sourceRows.length === 0 ? (
            <p className="py-6 text-[12px] text-muted">
              No sources reported in this range.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              {sourceRows.map(([source, count]) => {
                const percent = share(count);

                return (
                  <div
                    key={source}
                    className="grid h-[34px] grid-cols-[minmax(0,1fr)_72px_44px_46px] items-center gap-3 border-b border-line"
                  >
                    <span
                      title={source}
                      className="truncate text-[12px] text-ink-2"
                    >
                      {source}
                    </span>
                    <div className="h-[2px] overflow-hidden bg-sunken">
                      <div
                        className="h-full bg-ink-2/60"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-right font-mono text-[10.5px] text-ink-2 tabular-nums">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-right font-mono text-[10.5px] text-faint tabular-nums">
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center gap-2 px-5 py-2.5 text-[10.5px] text-faint">
        <span>Last updated {lastUpdated}</span>
        <span aria-hidden className="text-line">
          ·
        </span>
        <span>
          API{" "}
          <span
            className={cn(
              healthData?.status === "healthy" && "text-ok",
              healthData?.status === "degraded" && "text-warn",
              healthData?.status === "unhealthy" && "text-error",
            )}
          >
            {healthData?.status ?? "unreachable"}
          </span>
        </span>
      </div>
    </div>
  );
}
