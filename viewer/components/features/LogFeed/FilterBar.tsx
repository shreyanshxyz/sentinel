"use client";

import type { LogLevel } from "@/types/log";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const LEVEL_OPTIONS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"] as const;

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  levels: LogLevel[];
  sources: string[];
  availableSources: string[];
  onLevelsChange: (levels: LogLevel[]) => void;
  onSourcesChange: (sources: string[]) => void;
  onClear: () => void;
  onExport?: () => void;
  className?: string;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  levels,
  sources,
  availableSources,
  onLevelsChange,
  onSourcesChange,
  onClear,
  onExport,
  className,
}: FilterBarProps) {
  const hasFilters =
    searchQuery.length > 0 || levels.length > 0 || sources.length > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-line px-5 py-2",
        className,
      )}
    >
      <div className="relative flex w-full max-w-[264px] items-center">
        <SearchIcon className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-faint" />
        <label htmlFor="log-filter-search" className="sr-only">
          Filter messages
        </label>
        <input
          id="log-filter-search"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filter messages"
          className="h-[27px] w-full rounded-[5px] border border-line bg-surface pr-2 pl-7 text-[12px] text-ink transition-colors duration-150 placeholder:text-faint hover:border-line-strong focus:border-ink"
        />
      </div>

      <span aria-hidden className="h-4 w-px bg-line" />

      <MultiSelect
        label="Level"
        options={LEVEL_OPTIONS.map((level) => ({
          value: level,
          label: level,
        }))}
        values={levels}
        onChange={(values) => onLevelsChange(values as LogLevel[])}
      />

      <MultiSelect
        label="Source"
        options={availableSources.map((source) => ({
          value: source,
          label: source,
        }))}
        values={sources}
        onChange={onSourcesChange}
      />

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={!hasFilters}
        >
          Clear
        </Button>
        {onExport ? (
          <Button variant="secondary" size="sm" onClick={onExport}>
            Export
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default FilterBar;
