"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHead } from "@/components/layout/PageHead";
import { LogTable } from "@/components/features/LogFeed/LogTable";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { SearchIcon } from "@/components/ui/icons";
import { LogEntry, LogFilter, LogLevel } from "@/types/log";
import { useSearchLogs, useSources } from "@/hooks/useQueries";
import { APIError } from "@/lib/api";
import { cn } from "@/lib/utils";

type RangeKey = "any" | "15m" | "1h" | "6h" | "24h" | "7d" | "custom";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "15m", label: "Last 15 minutes" },
  { value: "1h", label: "Last hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "custom", label: "Custom range" },
];

const LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

const RANGE_MS: Record<Exclude<RangeKey, "any" | "custom">, number> = {
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "6h": 6 * 60 * 60_000,
  "24h": 24 * 60 * 60_000,
  "7d": 7 * 24 * 60 * 60_000,
};

function rangeBounds(
  range: RangeKey,
  customStart: string,
  customEnd: string,
): { startTime?: string; endTime?: string } {
  if (range === "any") return {};

  if (range === "custom") {
    const bounds: { startTime?: string; endTime?: string } = {};
    if (customStart) bounds.startTime = new Date(customStart).toISOString();
    if (customEnd) bounds.endTime = new Date(customEnd).toISOString();
    return bounds;
  }

  return {
    startTime: new Date(Date.now() - RANGE_MS[range]).toISOString(),
  };
}

function SearchFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHead title="Search" subtitle="Query the log store" />
      <div className="flex items-center gap-2 border-y border-line px-5 py-3 text-[11px] text-muted">
        <Spinner size="sm" />
        Loading search…
      </div>
    </div>
  );
}

function SearchScreen({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const [level, setLevel] = useState<LogLevel | "">("");
  const [source, setSource] = useState("");
  const [range, setRange] = useState<RangeKey>("any");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const initialFilter: LogFilter | null = initialQuery
    ? { query: initialQuery, limit: 100, offset: 0 }
    : null;
  const [appliedFilter, setAppliedFilter] = useState<LogFilter | null>(
    initialFilter,
  );
  const [hasSearched, setHasSearched] = useState(Boolean(initialFilter));

  const { data: sourcesData } = useSources();

  const {
    data: searchResponse,
    isFetching,
    error,
    refetch: executeSearch,
  } = useSearchLogs(appliedFilter ?? {}, hasSearched);

  const facets = searchResponse?.facets;
  const results: LogEntry[] = searchResponse?.data ?? [];
  const totalResults = searchResponse?.meta?.total ?? results.length;

  const levelOptions = useMemo(
    () => [
      { value: "", label: "All levels" },
      ...LEVELS.map((item) => ({
        value: item,
        label: item,
        hint: facets?.levels?.[item]
          ? facets.levels[item].toLocaleString()
          : undefined,
      })),
    ],
    [facets],
  );

  const sourceOptions = useMemo(() => {
    const facetNames = facets?.sources ? Object.keys(facets.sources) : [];
    const apiNames = sourcesData?.map((item) => item.name) ?? [];
    const names = Array.from(
      new Set([...facetNames, ...apiNames, ...(source ? [source] : [])]),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: "", label: "All sources" },
      ...names.map((name) => ({
        value: name,
        label: name,
        hint: facets?.sources?.[name]
          ? facets.sources[name].toLocaleString()
          : undefined,
      })),
    ];
  }, [facets, sourcesData, source]);

  const buildFilter = (): LogFilter => {
    const filter: LogFilter = { limit: 100, offset: 0 };
    const trimmed = query.trim();
    const bounds = rangeBounds(range, customStart, customEnd);

    if (trimmed) filter.query = trimmed;
    if (level) filter.levels = [level];
    if (source) filter.sources = [source];
    if (bounds.startTime) filter.startTime = bounds.startTime;
    if (bounds.endTime) filter.endTime = bounds.endTime;

    return filter;
  };

  const handleSearch = () => {
    const next = buildFilter();
    const same =
      appliedFilter !== null &&
      JSON.stringify(appliedFilter) === JSON.stringify(next);

    if (same) {
      void executeSearch();
    } else {
      setAppliedFilter(next);
    }
    setHasSearched(true);
  };

  const handleClear = () => {
    setQuery("");
    setLevel("");
    setSource("");
    setRange("any");
    setCustomStart("");
    setCustomEnd("");
    setAppliedFilter(null);
    setHasSearched(false);

    if (initialQuery) {
      router.replace("/search");
    }
  };

  const handleRowClick = (log: LogEntry) => {
    router.push(`/logs/${log.id}`);
  };

  const errorMessage = error
    ? error instanceof APIError
      ? error.message
      : "Search failed"
    : null;

  const effectiveQuery = appliedFilter?.query;
  const isSearching = hasSearched && isFetching;

  const emptyState = !hasSearched ? (
    <div className="flex flex-col items-center gap-1.5">
      <span>Run a search to see results.</span>
      <span className="text-[11px] text-faint">
        Set a query or filters, then press Search.
      </span>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2">
      <span>No events match this query.</span>
      <button
        type="button"
        onClick={handleClear}
        className="cursor-pointer text-[11.5px] text-ink underline underline-offset-2 hover:text-accent"
      >
        Clear filters
      </button>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHead title="Search" subtitle="Query the log store" />

      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-2">
        <div className="relative flex w-full max-w-[340px] items-center">
          <SearchIcon className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-faint" />
          <label htmlFor="search-query" className="sr-only">
            Search messages, IDs, sources
          </label>
          <input
            id="search-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search messages, IDs, sources"
            className="h-7 w-full rounded-[5px] border border-line bg-surface pr-2 pl-7 text-[12px] text-ink transition-colors duration-150 placeholder:text-faint hover:border-line-strong focus:border-ink"
          />
        </div>

        <Select
          options={levelOptions}
          value={level}
          onChange={(value) => setLevel(value as LogLevel | "")}
          className="w-[136px]"
          aria-label="Level"
        />

        <Select
          options={sourceOptions}
          value={source}
          onChange={setSource}
          className="w-[168px]"
          aria-label="Source"
        />

        <Select
          options={RANGE_OPTIONS}
          value={range}
          onChange={(value) => setRange(value as RangeKey)}
          className="w-[164px]"
          aria-label="Time range"
        />

        <Button
          variant="primary"
          size="md"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <Spinner size="sm" label="Searching…" />
            </>
          ) : (
            "Search"
          )}
        </Button>

        <Button variant="ghost" size="md" onClick={handleClear}>
          Clear
        </Button>
      </div>

      {range === "custom" ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-2">
          <label className="flex items-center gap-2 text-[11px] text-muted">
            From
            <input
              type="datetime-local"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="h-7 rounded-[5px] border border-line bg-surface px-2 text-[12px] text-ink hover:border-line-strong focus:border-ink"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] text-muted">
            To
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="h-7 rounded-[5px] border border-line bg-surface px-2 text-[12px] text-ink hover:border-line-strong focus:border-ink"
            />
          </label>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-center gap-3 border-b border-line bg-sunken px-5 py-2 text-[11.5px] text-error">
          <span className="min-w-0 flex-1 truncate">{errorMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void executeSearch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-b border-line px-5 py-1.5 text-[11px] text-muted">
        <span className="whitespace-nowrap">
          {hasSearched
            ? `${totalResults.toLocaleString()} ${
                totalResults === 1 ? "result" : "results"
              }`
            : "No search yet"}
        </span>
        {hasSearched ? (
          <>
            <span aria-hidden className="text-line">
              ·
            </span>
            <span
              className={cn(
                "min-w-0 truncate font-mono text-[10.5px] text-faint",
              )}
              title={effectiveQuery}
            >
              {effectiveQuery ? `query: ${effectiveQuery}` : "all events"}
            </span>
          </>
        ) : null}
        {hasSearched && totalResults > results.length ? (
          <span className="ml-auto whitespace-nowrap">
            showing first {results.length}
          </span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <LogTable
          logs={results}
          onRowClick={handleRowClick}
          loading={isSearching}
          emptyState={emptyState}
        />
      </div>
    </div>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  return <SearchScreen key={initialQuery} initialQuery={initialQuery} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageInner />
    </Suspense>
  );
}
