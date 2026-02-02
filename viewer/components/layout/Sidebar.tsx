"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Checkbox } from "../ui/Checkbox";
import { LogLevel } from "@/types/log";
import { cn } from "../../lib/utils";

interface Filters {
  levels: LogLevel[];
  sources: string[];
  labels: Record<string, string[]>;
}

export interface SidebarProps {
  className?: string;
  filters?: Filters;
  onFiltersChange?: (filters: Filters) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  availableSources?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  filters = { levels: [], sources: [], labels: {} },
  onFiltersChange,
  searchQuery = "",
  onSearchChange,
  availableSources,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>(
    filters.levels,
  );
  const [selectedSources, setSelectedSources] = useState<string[]>(
    filters.sources,
  );

  const logLevels: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
  const sources = availableSources || [
    "api-server",
    "database",
    "auth-service",
    "payment-gateway",
    "web-server",
  ];

  useEffect(() => {
    setSelectedLevels(filters.levels);
    setSelectedSources(filters.sources);
  }, [filters.levels, filters.sources]);

  const toggleLevel = (level: LogLevel) => {
    const newLevels = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];

    setSelectedLevels(newLevels);
    onFiltersChange?.({
      ...filters,
      levels: newLevels,
    });
  };

  const toggleSource = (source: string) => {
    const newSources = selectedSources.includes(source)
      ? selectedSources.filter((s) => s !== source)
      : [...selectedSources, source];

    setSelectedSources(newSources);
    onFiltersChange?.({
      ...filters,
      sources: newSources,
    });
  };

  return (
    <aside
      className={cn(
        "border-r border-terminal-border bg-terminal-secondary transition-all duration-300 relative",
        isExpanded ? "w-80" : "w-16",
        className,
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "absolute top-4 z-10 flex items-center justify-center w-6 h-12 bg-terminal-input border border-terminal-border hover:border-terminal-accent hover:bg-terminal-border transition-all duration-200 group",
          isExpanded
            ? "-right-3 rounded-l-md border-r-0"
            : "-right-3 rounded-l-md border-r-0",
        )}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <span
          className={cn(
            "text-terminal-muted group-hover:text-terminal-accent transition-transform duration-200 font-mono text-xs",
            isExpanded ? "rotate-0" : "rotate-180",
          )}
        >
          ◀
        </span>
      </button>

      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-terminal-border bg-terminal-input/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse" />
            <span className="font-mono text-sm text-terminal-accent uppercase tracking-wider">
              {isExpanded ? "SENTINEL" : "S"}
            </span>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="p-4 border-b border-terminal-border">
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                variant="command"
                prompt=""
              />
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              <div className="px-4">
                <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="text-terminal-accent">[</span>
                  LOG LEVELS
                  <span className="text-terminal-accent">]</span>
                </h3>
                <div className="space-y-1 border-l border-terminal-border/50 pl-3">
                  {logLevels.map((level) => (
                    <Checkbox
                      key={level}
                      checked={selectedLevels.includes(level)}
                      onChange={() => toggleLevel(level)}
                      variant="bracket"
                      size="sm"
                      label={
                        <Badge variant="log-level" level={level} size="sm">
                          {level}
                        </Badge>
                      }
                      className="py-1"
                    />
                  ))}
                </div>
              </div>

              <div className="px-4">
                <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="text-terminal-accent">[</span>
                  SOURCES
                  <span className="text-terminal-accent">]</span>
                </h3>
                <div className="space-y-1 border-l border-terminal-border/50 pl-3">
                  {sources.map((source) => (
                    <Checkbox
                      key={source}
                      checked={selectedSources.includes(source)}
                      onChange={() => toggleSource(source)}
                      variant="bracket"
                      size="sm"
                      label={
                        <span className="font-mono text-sm text-text-primary">
                          {source}
                        </span>
                      }
                      className="py-1"
                    />
                  ))}
                </div>
              </div>

              <div className="px-4">
                <h3 className="text-xs font-mono font-semibold text-terminal-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="text-terminal-accent">[</span>
                  ACTIONS
                  <span className="text-terminal-accent">]</span>
                </h3>
                <div className="space-y-1 border-l border-terminal-border/50 pl-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Export Logs
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-terminal-border bg-terminal-input/30">
              <div className="flex items-center justify-between text-[10px] font-mono text-terminal-muted">
                <span>STATUS:</span>
                <span className="text-terminal-accent flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
