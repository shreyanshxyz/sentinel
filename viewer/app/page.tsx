"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { Navigation } from "../components/layout/Navigation";
import { LogFeed } from "../components/features/LogFeed/LogFeed";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { LogEntry, LogLevel } from "@/types/log";
import { useLogStream, useLogBuffer } from "@/hooks/useLogStream";
import { useLogs, useHealth, useSources } from "@/hooks/useQueries";
import { APIError, checkAPIHealth } from "@/lib/api";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    levels: [] as LogLevel[],
    sources: [] as string[],
    labels: {} as Record<string, string[]>,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);
  const [useFallbackMode, setUseFallbackMode] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkAPIHealth(5000);
      setIsApiAvailable(isHealthy);

      if (!isHealthy) {
        console.warn(
          "API server is not available. Some features may be limited.",
        );
      }
    };

    checkHealth();
  }, []);

  const {
    data: initialLogs,
    isLoading: isLoadingInitial,
    error: initialLogsError,
  } = useLogs({ limit: 100 }, isApiAvailable !== false);

  const { data: healthData } = useHealth({
    refetchInterval: 30000,
  });

  const { data: sourcesData } = useSources(isApiAvailable !== false);

  const { logs: bufferedLogs, addLog, clear } = useLogBuffer(1000);

  const handleNewLog = useCallback(
    (log: LogEntry) => {
      if (!isPaused) {
        addLog(log);
      }
    },
    [isPaused, addLog],
  );

  const {
    isConnected,
    logsPerSecond,
    error: streamError,
    connect,
    disconnect,
  } = useLogStream({
    onLog: handleNewLog,
    onConnect: () => console.log("Connected to log stream"),
    onDisconnect: () => console.log("Disconnected from log stream"),
    onError: (err) => console.error("Stream error:", err),
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  });

  useEffect(() => {
    if (isApiAvailable && !useFallbackMode) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isApiAvailable, useFallbackMode, connect, disconnect]);

  const allLogs = React.useMemo(() => {
    const logs = [...(initialLogs || []), ...bufferedLogs];

    const uniqueLogs = Array.from(
      new Map(logs.map((log) => [log.id, log])).values(),
    );

    return uniqueLogs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [initialLogs, bufferedLogs]);

  const filteredLogs = React.useMemo(() => {
    return allLogs.filter((log) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          log.message.toLowerCase().includes(query) ||
          log.source.toLowerCase().includes(query) ||
          log.id.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filters.levels.length > 0 && !filters.levels.includes(log.level)) {
        return false;
      }

      if (filters.sources.length > 0 && !filters.sources.includes(log.source)) {
        return false;
      }

      return true;
    });
  }, [allLogs, searchQuery, filters]);

  const handleClearLogs = () => {
    clear();
  };

  const navigationItems = [
    { label: "Live Feed", href: "/", badge: isConnected ? "LIVE" : "OFFLINE" },
    { label: "Search", href: "/search" },
    { label: "Analytics", href: "/analytics" },
    { label: "Settings", href: "/settings" },
  ];

  const headerActions = (
    <>
      <Button variant="terminal" size="sm">
        Quick Filter
      </Button>
      <Button variant="secondary" size="sm">
        Export
      </Button>
    </>
  );

  const handleLogClick = (log: LogEntry) => {
    console.log("Log clicked:", log.id);
    window.location.href = `/logs/${log.id}`;
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (initialLogsError && initialLogsError instanceof APIError) {
    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-log-error text-4xl font-mono">API ERROR</div>
            <p className="text-terminal-muted font-mono">
              {initialLogsError.message}
            </p>
            {initialLogsError.code && (
              <p className="text-terminal-muted font-mono text-sm">
                Error Code: {initialLogsError.code}
              </p>
            )}
            <div className="space-x-4 mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-terminal-border bg-terminal-input hover:border-terminal-accent hover:bg-terminal-border transition-colors font-mono text-sm"
              >
                [ RETRY ]
              </button>
              <button
                onClick={() => setUseFallbackMode(true)}
                className="px-4 py-2 border border-terminal-border bg-terminal-input hover:border-terminal-accent hover:bg-terminal-border transition-colors font-mono text-sm"
              >
                [ USE OFFLINE MODE ]
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingInitial && !useFallbackMode) {
    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <div className="flex-1 flex items-center justify-center">
          <Spinner variant="blocks" size="lg" text="CONNECTING TO API..." />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <Header
        title="Sentinel"
        subtitle="Real-time log monitoring and analysis"
        actions={headerActions}
        status={{
          connected: isConnected,
          logsPerSecond: Number(logsPerSecond.toFixed(1)),
          totalLogs: filteredLogs.length,
        }}
      />

      <div className="border-b border-terminal-border bg-terminal-secondary px-6">
        <Navigation items={navigationItems} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableSources={sourcesData?.map((s) => s.name) || []}
        />

        <div className="flex-1 p-4">
          {streamError && (
            <div className="mb-4 p-2 border border-log-error text-log-error font-mono text-sm">
              Stream Error: {streamError.message}. Attempting to reconnect...
            </div>
          )}

          {!isConnected && !useFallbackMode && (
            <div className="mb-4 p-2 border border-terminal-accent text-terminal-accent font-mono text-sm">
              Connecting to real-time log stream...
            </div>
          )}

          <LogFeed
            logs={filteredLogs}
            autoScroll={true}
            onLogClick={handleLogClick}
            isPaused={isPaused}
            onPauseChange={setIsPaused}
            onClear={handleClearLogs}
            navigateOnClick={true}
          />
        </div>
      </div>
    </div>
  );
}
