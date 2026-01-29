"use client";

import { useState } from "react";
import { Header } from "../../components/layout/Header";
import { Navigation } from "../../components/layout/Navigation";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { LogItem } from "../../components/features/LogItem/LogItem";
import { LogEntry, LogLevel } from "@/types/log";
import { generateMockLogEntries } from "../../lib/mock-data";
import { cn } from "../../lib/utils";

interface DateRange {
  start: string;
  end: string;
}

interface SearchFilters {
  query: string;
  service: string;
  level: LogLevel | "";
  dateRange: DateRange;
  labels: Record<string, string>;
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    service: "",
    level: "",
    dateRange: {
      start: "",
      end: "",
    },
    labels: {},
  });

  const [results, setResults] = useState<LogEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [hoveredLog, setHoveredLog] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const navigationItems = [
    { label: "Live Feed", href: "/" },
    { label: "Search", href: "/search", badge: "NEW" },
    { label: "Analytics", href: "/analytics" },
    { label: "Settings", href: "/settings" },
  ];

  const serviceOptions = [
    { value: "", label: "All Services" },
    { value: "api-server", label: "api-server" },
    { value: "database", label: "database" },
    { value: "auth-service", label: "auth-service" },
    { value: "payment-gateway", label: "payment-gateway" },
    { value: "web-server", label: "web-server" },
    { value: "cache", label: "cache" },
    { value: "queue-worker", label: "queue-worker" },
  ];

  const levelOptions = [
    { value: "", label: "All Levels" },
    { value: "DEBUG", label: "DEBUG" },
    { value: "INFO", label: "INFO" },
    { value: "WARN", label: "WARN" },
    { value: "ERROR", label: "ERROR" },
    { value: "FATAL", label: "FATAL" },
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate mock search results
    const mockResults = generateMockLogEntries(25);

    // Filter based on search criteria
    let filtered = mockResults;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          log.source.toLowerCase().includes(query),
      );
    }

    if (filters.service) {
      filtered = filtered.filter((log) => log.source === filters.service);
    }

    if (filters.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter((log) => new Date(log.timestamp) >= startDate);
    }

    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter((log) => new Date(log.timestamp) <= endDate);
    }

    setResults(filtered);
    setTotalResults(filtered.length);
    setIsSearching(false);
  };

  const handleClearFilters = () => {
    setFilters({
      query: "",
      service: "",
      level: "",
      dateRange: {
        start: "",
        end: "",
      },
      labels: {},
    });
    setResults([]);
    setHasSearched(false);
  };

  const handleLogClick = (log: LogEntry) => {
    console.log("Log clicked:", log.id);
  };

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <Header
        title="Sentinel"
        subtitle="Search and filter log entries"
        status={{
          connected: true,
          logsPerSecond: 0,
          totalLogs: totalResults,
        }}
      />

      <div className="border-b border-terminal-border bg-terminal-secondary px-6">
        <Navigation items={navigationItems} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Search Sidebar */}
        <aside
          className={cn(
            "border-r border-terminal-border bg-terminal-secondary flex flex-col transition-all duration-300 relative",
            isSidebarExpanded ? "w-80" : "w-16",
          )}
        >
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={cn(
              "absolute top-4 z-10 flex items-center justify-center w-6 h-12 bg-terminal-input border border-terminal-border hover:border-terminal-accent hover:bg-terminal-border transition-all duration-200 group",
              isSidebarExpanded
                ? "-right-3 rounded-l-md border-r-0"
                : "-right-3 rounded-l-md border-r-0",
            )}
            title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span
              className={cn(
                "text-terminal-muted group-hover:text-terminal-accent transition-transform duration-200 font-mono text-xs",
                isSidebarExpanded ? "rotate-0" : "rotate-180",
              )}
            >
              ◀
            </span>
          </button>

          {isSidebarExpanded && (
            <div className="p-4 border-b border-terminal-border bg-terminal-input/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse" />
                <span className="font-mono text-sm text-terminal-accent uppercase tracking-wider">
                  SEARCH
                </span>
              </div>
            </div>
          )}

          {isSidebarExpanded ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Text Search */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-terminal-accent">[</span>
                    QUERY
                    <span className="text-terminal-accent">]</span>
                  </h3>
                  <Input
                    placeholder="Search logs..."
                    value={filters.query}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, query: e.target.value }))
                    }
                    variant="command"
                    prompt=""
                  />
                </div>

                {/* Service Filter */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-terminal-accent">[</span>
                    SERVICE
                    <span className="text-terminal-accent">]</span>
                  </h3>
                  <Select
                    options={serviceOptions}
                    value={filters.service}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, service: value }))
                    }
                    placeholder="Select service..."
                    variant="terminal"
                    size="md"
                  />
                </div>

                {/* Level Filter */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-terminal-accent">[</span>
                    LEVEL
                    <span className="text-terminal-accent">]</span>
                  </h3>
                  <Select
                    options={levelOptions}
                    value={filters.level}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        level: value as LogLevel,
                      }))
                    }
                    placeholder="Select level..."
                    variant="terminal"
                    size="md"
                  />
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-terminal-accent">[</span>
                    TIME RANGE
                    <span className="text-terminal-accent">]</span>
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-mono text-terminal-muted uppercase">
                        From
                      </label>
                      <input
                        type="datetime-local"
                        value={filters.dateRange.start}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              start: e.target.value,
                            },
                          }))
                        }
                        className="w-full h-9 px-3 border border-terminal-fg/30 bg-terminal-input text-terminal-fg font-mono text-sm focus:border-terminal-fg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-terminal-muted uppercase">
                        To
                      </label>
                      <input
                        type="datetime-local"
                        value={filters.dateRange.end}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              end: e.target.value,
                            },
                          }))
                        }
                        className="w-full h-9 px-3 border border-terminal-fg/30 bg-terminal-input text-terminal-fg font-mono text-sm focus:border-terminal-fg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="text-terminal-accent">[</span>
                    PRESETS
                    <span className="text-terminal-accent">]</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Last 1h", hours: 1 },
                      { label: "Last 6h", hours: 6 },
                      { label: "Last 24h", hours: 24 },
                      { label: "Last 7d", hours: 168 },
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const end = new Date();
                          const start = new Date(
                            end.getTime() - preset.hours * 60 * 60 * 1000,
                          );
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: {
                              start: start.toISOString().slice(0, 16),
                              end: end.toISOString().slice(0, 16),
                            },
                          }));
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Actions */}
              <div className="p-4 border-t border-terminal-border bg-terminal-input/30 space-y-2">
                <Button
                  variant="terminal"
                  size="md"
                  className="w-full"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" variant="terminal" />
                      SEARCHING...
                    </span>
                  ) : (
                    "EXECUTE SEARCH"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleClearFilters}
                >
                  CLEAR FILTERS
                </Button>
              </div>
            </>
          ) : null}
        </aside>

        {/* Results Area */}
        <div className="flex-1 p-4 overflow-hidden">
          <Card variant="terminal" className="h-full flex flex-col">
            {/* Results Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-fg/20 bg-terminal-input">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-log-error" />
                  <div className="w-2.5 h-2.5 bg-log-warn" />
                  <div className="w-2.5 h-2.5 bg-terminal-accent" />
                </div>
                <span className="text-terminal-fg font-mono text-xs tracking-wide">
                  sentinel@search:~$ grep -r
                  {filters.query && ` "${filters.query}"`}
                  {filters.service && ` --source=${filters.service}`}
                  {filters.level && ` --level=${filters.level}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasSearched && !isSearching && (
                  <Badge variant="terminal" size="sm">
                    {results.length} results
                  </Badge>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto font-mono text-sm bg-black">
              {!hasSearched ? (
                <div className="flex items-center justify-center h-full text-terminal-muted">
                  <div className="text-center">
                    <div className="text-terminal-fg text-lg mb-2">
                      $ grep --help
                    </div>
                    <p className="font-mono text-xs mb-4">
                      Configure search parameters and click EXECUTE SEARCH
                    </p>
                    <div className="text-terminal-muted text-xs space-y-1">
                      <p>Usage: Enter query terms and filters</p>
                      <p>Press EXECUTE SEARCH to run query</p>
                    </div>
                  </div>
                </div>
              ) : isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Spinner
                      variant="blocks"
                      size="lg"
                      text="SCANNING LOGS..."
                    />
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="flex items-center justify-center h-full text-terminal-muted">
                  <div className="text-center">
                    <div className="text-log-error text-lg mb-2">
                      $ grep: no matches found
                    </div>
                    <p className="font-mono text-xs">
                      No logs match your search criteria
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {results.map((log) => (
                    <LogItem
                      key={log.id}
                      log={log}
                      onClick={handleLogClick}
                      isHovered={hoveredLog === log.id}
                      onMouseEnter={() => setHoveredLog(log.id)}
                      onMouseLeave={() => setHoveredLog(null)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Results Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-terminal-fg/20 bg-terminal-input">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-mono text-xs uppercase tracking-wider",
                    isSearching ? "text-log-warn" : "text-terminal-accent",
                  )}
                >
                  {isSearching ? "◉ SCANNING" : "● READY"}
                </span>
              </div>

              <div className="text-terminal-muted font-mono text-xs">
                {hasSearched && !isSearching
                  ? `> Found ${results.length} matching entries`
                  : "> Waiting for query..."}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
