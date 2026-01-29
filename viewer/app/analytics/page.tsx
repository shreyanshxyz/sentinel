"use client";

import React, { useState, useMemo } from "react";
import { Header } from "../../components/layout/Header";
import { Navigation } from "../../components/layout/Navigation";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

interface StatsData {
  total: number;
  good: number;
  bad: number;
  byLevel: {
    DEBUG: number;
    INFO: number;
    WARN: number;
    ERROR: number;
    FATAL: number;
  };
  bySource: Record<string, number>;
  avgPerMinute: number;
  peakPerMinute: number;
}

const mockStats: Record<TimeRange, StatsData> = {
  "1h": {
    total: 15420,
    good: 14200,
    bad: 1220,
    byLevel: { DEBUG: 3200, INFO: 9800, WARN: 1800, ERROR: 520, FATAL: 100 },
    bySource: {
      "api-server": 5200,
      database: 3100,
      "auth-service": 2100,
      "payment-gateway": 1800,
      "web-server": 2200,
      cache: 800,
      "queue-worker": 220,
    },
    avgPerMinute: 257,
    peakPerMinute: 412,
  },
  "6h": {
    total: 89240,
    good: 82100,
    bad: 7140,
    byLevel: { DEBUG: 18500, INFO: 56800, WARN: 9800, ERROR: 3100, FATAL: 540 },
    bySource: {
      "api-server": 30100,
      database: 18200,
      "auth-service": 12100,
      "payment-gateway": 10400,
      "web-server": 12800,
      cache: 4200,
      "queue-worker": 1440,
    },
    avgPerMinute: 248,
    peakPerMinute: 520,
  },
  "24h": {
    total: 356800,
    good: 328400,
    bad: 28400,
    byLevel: {
      DEBUG: 74200,
      INFO: 227000,
      WARN: 39200,
      ERROR: 12400,
      FATAL: 2000,
    },
    bySource: {
      "api-server": 120400,
      database: 72800,
      "auth-service": 48400,
      "payment-gateway": 41600,
      "web-server": 51200,
      cache: 16800,
      "queue-worker": 5600,
    },
    avgPerMinute: 248,
    peakPerMinute: 680,
  },
  "7d": {
    total: 2497600,
    good: 2298800,
    bad: 198800,
    byLevel: {
      DEBUG: 519400,
      INFO: 1589000,
      WARN: 274400,
      ERROR: 86800,
      FATAL: 14000,
    },
    bySource: {
      "api-server": 842800,
      database: 509600,
      "auth-service": 338800,
      "payment-gateway": 291200,
      "web-server": 358400,
      cache: 117600,
      "queue-worker": 39200,
    },
    avgPerMinute: 248,
    peakPerMinute: 890,
  },
  "30d": {
    total: 10704000,
    good: 9852000,
    bad: 852000,
    byLevel: {
      DEBUG: 2226000,
      INFO: 6810000,
      WARN: 1176000,
      ERROR: 372000,
      FATAL: 60000,
    },
    bySource: {
      "api-server": 3612000,
      database: 2184000,
      "auth-service": 1452000,
      "payment-gateway": 1248000,
      "web-server": 1536000,
      cache: 504000,
      "queue-worker": 168000,
    },
    avgPerMinute: 248,
    peakPerMinute: 1200,
  },
};

const timeRangeLabels: Record<TimeRange, string> = {
  "1h": "1 HOUR",
  "6h": "6 HOURS",
  "24h": "24 HOURS",
  "7d": "7 DAYS",
  "30d": "30 DAYS",
};

interface StatBoxProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "default" | "good" | "bad" | "accent";
}

function StatBox({ label, value, subtext, variant = "default" }: StatBoxProps) {
  return (
    <div className="border border-terminal-border bg-terminal-input/30 p-4">
      <div className="text-terminal-muted text-xs font-mono uppercase tracking-wider mb-2">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-mono font-bold",
          variant === "good" && "text-terminal-accent",
          variant === "bad" && "text-log-error",
          variant === "accent" && "text-log-info",
          variant === "default" && "text-text-primary",
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtext && (
        <div className="text-terminal-muted text-xs font-mono mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
}

interface LevelBarProps {
  level: string;
  count: number;
  total: number;
  color: string;
}

function LevelBar({ level, count, total, color }: LevelBarProps) {
  const percentage = ((count / total) * 100).toFixed(1);
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-16 text-xs font-mono text-terminal-muted">{level}</div>
      <div className="flex-1 h-6 bg-terminal-input border border-terminal-border relative">
        <div
          className={cn("h-full transition-all duration-300", color)}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <span className="text-xs font-mono text-text-primary z-10">
            {count.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-terminal-muted z-10">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24h");
  const stats = mockStats[selectedRange];

  const goodPercentage = useMemo(
    () => ((stats.good / stats.total) * 100).toFixed(1),
    [stats],
  );

  const badPercentage = useMemo(
    () => ((stats.bad / stats.total) * 100).toFixed(1),
    [stats],
  );

  const navigationItems = [
    { label: "Live Feed", href: "/" },
    { label: "Search", href: "/search" },
    { label: "Analytics", href: "/analytics", badge: "STATS" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <Header
        title="Sentinel"
        subtitle="Analytics and statistics"
        status={{
          connected: true,
          logsPerSecond: 0,
          totalLogs: stats.total,
        }}
      />

      <div className="border-b border-terminal-border bg-terminal-secondary px-6">
        <Navigation items={navigationItems} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card variant="terminal" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-terminal-accent font-mono text-sm">
                  $
                </span>
                <span className="text-terminal-fg font-mono text-sm">
                  analytics --range
                </span>
              </div>
              <Badge variant="terminal" size="sm">
                {timeRangeLabels[selectedRange]}
              </Badge>
            </div>
            <div className="flex gap-2">
              {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={cn(
                    "px-3 py-1.5 font-mono text-xs border transition-all duration-150",
                    selectedRange === range
                      ? "bg-terminal-accent/20 border-terminal-accent text-terminal-accent"
                      : "border-terminal-border text-terminal-muted hover:text-text-primary hover:border-terminal-muted",
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox
              label="Total Logs"
              value={stats.total}
              subtext={`${stats.avgPerMinute}/min avg`}
              variant="accent"
            />
            <StatBox
              label="Good Logs"
              value={stats.good}
              subtext={`${goodPercentage}% of total`}
              variant="good"
            />
            <StatBox
              label="Bad Logs"
              value={stats.bad}
              subtext={`${badPercentage}% of total`}
              variant="bad"
            />
            <StatBox
              label="Peak Rate"
              value={`${stats.peakPerMinute}/min`}
              subtext="highest volume"
              variant="default"
            />
          </div>

          <Card variant="terminal" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-terminal-accent font-mono text-sm">$</span>
              <span className="text-terminal-fg font-mono text-sm">
                {`cat levels.json | jq ".distribution"`}
              </span>
            </div>
            <div className="space-y-1">
              <LevelBar
                level="DEBUG"
                count={stats.byLevel.DEBUG}
                total={stats.total}
                color="bg-terminal-muted/50"
              />
              <LevelBar
                level="INFO"
                count={stats.byLevel.INFO}
                total={stats.total}
                color="bg-log-info/60"
              />
              <LevelBar
                level="WARN"
                count={stats.byLevel.WARN}
                total={stats.total}
                color="bg-log-warn/60"
              />
              <LevelBar
                level="ERROR"
                count={stats.byLevel.ERROR}
                total={stats.total}
                color="bg-log-error/60"
              />
              <LevelBar
                level="FATAL"
                count={stats.byLevel.FATAL}
                total={stats.total}
                color="bg-log-fatal/80"
              />
            </div>
          </Card>

          <Card variant="terminal" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-terminal-accent font-mono text-sm">$</span>
              <span className="text-terminal-fg font-mono text-sm">
                {`cat sources.json | jq ".counts"`}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stats.bySource)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => {
                  const percentage = ((count / stats.total) * 100).toFixed(1);
                  return (
                    <div
                      key={source}
                      className="flex items-center justify-between p-3 border border-terminal-border bg-terminal-input/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-terminal-accent font-mono text-xs">
                          ◉
                        </span>
                        <span className="font-mono text-sm text-text-primary">
                          {source}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-text-primary">
                          {count.toLocaleString()}
                        </span>
                        <span className="font-mono text-xs text-terminal-muted w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-terminal-muted text-xs font-mono">
              <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-pulse" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span className="text-terminal-border">|</span>
              <span>Data source: mock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
