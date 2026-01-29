"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { Navigation } from "../components/layout/Navigation";
import { LogFeed } from "../components/features/LogFeed/LogFeed";
import { Button } from "../components/ui/Button";
import { LogEntry, LogLevel } from "@/types/log";
import { generateMockLogEntry } from "../lib/mock-data";

export default function Home() {
  const initialLogs = Array.from({ length: 20 }, () => generateMockLogEntry());
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [logsPerSecond, setLogsPerSecond] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    levels: [] as LogLevel[],
    sources: [] as string[],
    labels: {} as Record<string, string[]>,
  });

  useEffect(() => {
    if (!isConnected || isPaused) return;

    const interval = setInterval(
      () => {
        const newLog = generateMockLogEntry();
        setLogs((prev) => [...prev.slice(-99), newLog]);
        setLogsPerSecond(Math.random() * 5);
      },
      Math.random() * 2000 + 500,
    );

    return () => clearInterval(interval);
  }, [isConnected, isPaused]);

  const handleClearLogs = () => {
    setLogs([]);
  };

  const navigationItems = [
    { label: "Live Feed", href: "/", badge: "LIVE" },
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
    // Navigate to log detail page
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <Header
        title="Sentinel"
        subtitle="Real-time log monitoring and analysis"
        actions={headerActions}
        status={{
          connected: isConnected,
          logsPerSecond: Number(logsPerSecond.toFixed(1)),
          totalLogs: logs.length,
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
        />

        <div className="flex-1 p-4">
          <LogFeed
            logs={logs}
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
