"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHead } from "@/components/layout/PageHead";
import { FilterBar } from "@/components/features/LogFeed/FilterBar";
import { LogFeed } from "@/components/features/LogFeed/LogFeed";
import { LogTable } from "@/components/features/LogFeed/LogTable";
import { VolumeHistogram } from "@/components/features/LogFeed/VolumeHistogram";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusChip } from "@/components/ui/StatusChip";
import { LogEntry, LogLevel } from "@/types/log";
import { useLogStream, useLogBuffer } from "@/hooks/useLogStream";
import { useLogs, useSources } from "@/hooks/useQueries";
import { APIError, checkAPIHealth } from "@/lib/api";
import { downloadLogs } from "@/lib/export";
import { formatRelative } from "@/lib/format";
import {
  clearStoredFilters,
  getSettings,
  readStoredFilters,
  writeStoredFilters,
} from "@/lib/settings";
import { useSettings } from "@/providers/SettingsProvider";
import { cn } from "@/lib/utils";

type Range = "15m" | "1h" | "24h" | "7d";

const LEVEL_VALUES: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

function isLogLevel(value: string): value is LogLevel {
  return (LEVEL_VALUES as string[]).includes(value);
}

function isRange(value: string): value is Range {
  return value === "15m" || value === "1h" || value === "24h" || value === "7d";
}

const RANGE_MS: Record<Range, number> = {
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "24h": 24 * 60 * 60_000,
  "7d": 7 * 24 * 60 * 60_000,
};

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
];

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "error" | "warn" | undefined;
}) {
  return (
    <div className="min-w-0 flex-1 border-l border-line px-4 py-2.5 first:border-l-0">
      <div className="text-[10px] font-semibold tracking-[.08em] text-faint uppercase">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-[21px] leading-[1.1] font-semibold tabular-nums",
          tone === "error" && "text-error",
          tone === "warn" && "text-warn",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const settings = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [levels, setLevels] = useState<LogLevel[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [range, setRange] = useState<Range>("1h");
  const [isPaused, setIsPaused] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);
  const [useFallbackMode, setUseFallbackMode] = useState(false);

  useEffect(() => {
    if (!getSettings().persistFilters) return;
    const stored = readStoredFilters();
    if (!stored) return;

    queueMicrotask(() => {
      setSearchQuery(stored.searchQuery);
      setLevels(stored.levels.filter(isLogLevel));
      setSources(stored.sources);
      if (isRange(stored.range)) setRange(stored.range);
    });
  }, []);

  useEffect(() => {
    if (!settings.persistFilters) {
      clearStoredFilters();
      return;
    }

    writeStoredFilters({ searchQuery, levels, sources, range });
  }, [
    settings.persistFilters,
    searchQuery,
    levels,
    sources,
    range,
  ]);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      const isHealthy = await checkAPIHealth(5000);
      if (cancelled) return;
      setIsApiAvailable(isHealthy);

      if (!isHealthy) {
        console.warn(
          "API server is not available. Some features may be limited.",
        );
      }
    };

    checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const {
    data: initialLogs,
    isLoading: isLoadingInitial,
    error: initialLogsError,
  } = useLogs({ limit: 100 }, isApiAvailable !== false && !useFallbackMode);

  const { data: sourcesData } = useSources(isApiAvailable !== false);

  const { logs: bufferedLogs, addLog, clear } = useLogBuffer(
    settings.maxLogsInMemory,
  );

  // The stream callback keeps a stable identity so pause/resume never tears
  // down the EventSource; appends are gated through this ref instead.
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleNewLog = useCallback(
    (log: LogEntry) => {
      if (!isPausedRef.current) {
        addLog(log);
      }
    },
    [addLog],
  );

  const {
    isConnected,
    logsPerSecond,
    error: streamError,
    connect,
    disconnect,
  } = useLogStream({
    onLog: handleNewLog,
    reconnectInterval: settings.reconnectInterval,
    maxReconnectAttempts: settings.maxReconnectAttempts,
  });

  useEffect(() => {
    if (isApiAvailable && !useFallbackMode) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isApiAvailable, useFallbackMode, connect, disconnect]);

  const [windowNow, setWindowNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setWindowNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const allLogs = useMemo(() => {
    const logs = [...(initialLogs || []), ...bufferedLogs];
    const uniqueLogs = Array.from(
      new Map(logs.map((log) => [log.id, log])).values(),
    );

    return uniqueLogs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [initialLogs, bufferedLogs]);

  const windowedLogs = useMemo(() => {
    const cutoff = windowNow - RANGE_MS[range];
    return allLogs.filter(
      (log) => new Date(log.timestamp).getTime() >= cutoff,
    );
  }, [allLogs, range, windowNow]);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return windowedLogs.filter((log) => {
      if (query) {
        const matches =
          log.message.toLowerCase().includes(query) ||
          log.source.toLowerCase().includes(query) ||
          log.id.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (levels.length > 0 && !levels.includes(log.level)) return false;
      if (sources.length > 0 && !sources.includes(log.source)) return false;

      return true;
    });
  }, [windowedLogs, searchQuery, levels, sources]);

  const metrics = useMemo(() => {
    let errors = 0;
    let warnings = 0;
    const uniqueSources = new Set<string>();

    for (const log of windowedLogs) {
      if (log.level === "ERROR" || log.level === "FATAL") errors += 1;
      if (log.level === "WARN") warnings += 1;
      uniqueSources.add(log.source);
    }

    return {
      records: windowedLogs.length,
      errors,
      warnings,
      sources: uniqueSources.size,
      rate: logsPerSecond,
    };
  }, [windowedLogs, logsPerSecond]);

  const availableSources = useMemo(() => {
    const fromApi = sourcesData?.map((source) => source.name) ?? [];
    const fromLogs = allLogs.map((log) => log.source);
    const names = fromApi.length > 0 ? fromApi : fromLogs;
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [sourcesData, allLogs]);

  const feedLogs = useMemo(() => [...filteredLogs].reverse(), [filteredLogs]);

  const lastEventAt = allLogs[0]?.timestamp;
  const sourceCount = sourcesData?.length || metrics.sources;
  const hasFilters =
    searchQuery.length > 0 || levels.length > 0 || sources.length > 0;

  const handleClearFilters = () => {
    setSearchQuery("");
    setLevels([]);
    setSources([]);
  };

  const handleClearLogs = () => {
    clear();
  };

  const handleLogClick = (log: LogEntry) => {
    router.push(`/dashboard/logs/${log.id}`);
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    downloadLogs(filteredLogs);
  };

  const emptyState = (
    <div className="flex flex-col items-center gap-2">
      <span>No events in this window.</span>
      {hasFilters ? (
        <button
          type="button"
          onClick={handleClearFilters}
          className="cursor-pointer text-[11.5px] text-ink underline underline-offset-2 hover:text-accent"
        >
          Clear filters
        </button>
      ) : (
        <span className="text-[11px] text-faint">
          Waiting for new events on the live stream.
        </span>
      )}
    </div>
  );

  if (initialLogsError && !useFallbackMode) {
    const message =
      initialLogsError instanceof APIError
        ? initialLogsError.message
        : "The API request failed.";
    const code =
      initialLogsError instanceof APIError ? initialLogsError.code : undefined;

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHead
          title="Logs"
          subtitle="Live log monitoring"
          status={<StatusChip tone="error">Offline</StatusChip>}
        />
        <div className="flex flex-1 items-center justify-center px-5 pb-10">
          <div className="w-full max-w-[440px] rounded-[5px] border border-line bg-canvas p-6">
            <h2 className="text-[13px] font-semibold text-ink">
              Can&apos;t reach the API
            </h2>
            <p className="mt-2 text-[11.5px] leading-[1.5] text-muted">
              {message}
            </p>
            {code ? (
              <p className="mt-1 font-mono text-[10.5px] text-faint">{code}</p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseFallbackMode(true)}
              >
                Use offline mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingInitial && !useFallbackMode) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHead
          title="Logs"
          subtitle="Loading recent events"
          status={<StatusChip tone="paused">Connecting</StatusChip>}
        />
        <div className="flex border-y border-line">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="min-w-0 flex-1 border-l border-line px-4 py-2.5 first:border-l-0"
            >
              <div className="h-2 w-12 bg-line" />
              <div className="mt-2 h-4 w-16 bg-sunken" />
            </div>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <LogTable logs={[]} loading />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHead
        title="Logs"
        status={
          <StatusChip tone={isPaused ? "paused" : "live"}>
            {isPaused ? "Paused" : "Live"}
          </StatusChip>
        }
        subtitle={`Streaming from ${sourceCount.toLocaleString()} ${
          sourceCount === 1 ? "source" : "sources"
        }`}
        actions={
          <>
            <SegmentedControl
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              ariaLabel="Time window"
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsPaused((paused) => !paused)}
            >
              {isPaused ? "Resume stream" : "Pause stream"}
            </Button>
          </>
        }
      />

      <div className="flex border-y border-line">
        <Metric label="Records" value={metrics.records.toLocaleString()} />
        <Metric
          label="Errors"
          value={metrics.errors.toLocaleString()}
          tone={metrics.errors > 0 ? "error" : undefined}
        />
        <Metric
          label="Warnings"
          value={metrics.warnings.toLocaleString()}
          tone={metrics.warnings > 0 ? "warn" : undefined}
        />
        <Metric label="Sources" value={metrics.sources.toLocaleString()} />
        <Metric
          label="Rate"
          value={`${metrics.rate.toFixed(0)}/s`}
        />
      </div>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        levels={levels}
        sources={sources}
        availableSources={availableSources}
        onLevelsChange={setLevels}
        onSourcesChange={setSources}
        onClear={handleClearFilters}
      />

      <div className="flex items-center gap-2 border-b border-line px-5 py-1.5 text-[11px] text-muted">
        <span className="truncate">
          {filteredLogs.length.toLocaleString()} events · updated{" "}
          {lastEventAt ? formatRelative(lastEventAt) : "—"}
        </span>
        <span className="ml-auto whitespace-nowrap tabular-nums">
          Showing {filteredLogs.length.toLocaleString()} of{" "}
          {windowedLogs.length.toLocaleString()}
        </span>
      </div>

      <VolumeHistogram logs={allLogs} minutes={60} />

      <LogFeed
        logs={feedLogs}
        isPaused={isPaused}
        isConnected={isConnected}
        streamError={streamError}
        totalBuffered={bufferedLogs.length}
        lastEventAt={lastEventAt}
        onLogClick={handleLogClick}
        onClear={handleClearLogs}
        onRetry={connect}
        emptyState={emptyState}
      />
    </div>
  );
}
