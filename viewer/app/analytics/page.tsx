"use client";

import React, { useState, useMemo } from "react";
import { Header } from "../../components/layout/Header";
import { Navigation } from "../../components/layout/Navigation";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { cn } from "../../lib/utils";
import { useAnalytics, useHealth } from "@/hooks/useQueries";
import { APIError } from "@/lib/api";
import { LogLevel } from "@/types/log";

type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

interface StatsData {
  total: number;
  good: number;
  bad: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
  avgPerMinute: number;
  peakPerMinute: number;
}

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
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
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

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useAnalytics(selectedRange, true);

  const { data: healthData } = useHealth({
    refetchInterval: 30000,
  });

  const stats: StatsData = useMemo(() => {
    if (!analyticsData) {
      return {
        total: 0,
        good: 0,
        bad: 0,
        byLevel: {
          DEBUG: 0,
          INFO: 0,
          WARN: 0,
          ERROR: 0,
          FATAL: 0,
        },
        bySource: {},
        avgPerMinute: 0,
        peakPerMinute: 0,
      };
    }

    const byLevel = analyticsData.byLevel || {};
    const bySource = analyticsData.bySource || {};
    const total = analyticsData.total || 0;

    const good = (byLevel.DEBUG || 0) + (byLevel.INFO || 0);

    const bad =
      (byLevel.WARN || 0) + (byLevel.ERROR || 0) + (byLevel.FATAL || 0);

    const hours = parseInt(selectedRange);
    const minutes = hours * 60;
    const avgPerMinute = minutes > 0 ? Math.round(total / minutes) : 0;

    const peakPerMinute = healthData?.metrics?.logsPerSecond
      ? Math.round(healthData.metrics.logsPerSecond * 60)
      : avgPerMinute * 2;

    return {
      total,
      good,
      bad,
      byLevel: {
        DEBUG: byLevel.DEBUG || 0,
        INFO: byLevel.INFO || 0,
        WARN: byLevel.WARN || 0,
        ERROR: byLevel.ERROR || 0,
        FATAL: byLevel.FATAL || 0,
      },
      bySource,
      avgPerMinute,
      peakPerMinute,
    };
  }, [analyticsData, healthData, selectedRange]);

  const goodPercentage = useMemo(
    () =>
      stats.total > 0 ? ((stats.good / stats.total) * 100).toFixed(1) : "0.0",
    [stats],
  );

  const badPercentage = useMemo(
    () =>
      stats.total > 0 ? ((stats.bad / stats.total) * 100).toFixed(1) : "0.0",
    [stats],
  );

  const navigationItems = [
    { label: "Live Feed", href: "/" },
    { label: "Search", href: "/search" },
    { label: "Analytics", href: "/analytics", badge: "STATS" },
    { label: "Settings", href: "/settings" },
  ];

  const errorMessage = error
    ? error instanceof APIError
      ? error.message
      : "Failed to load analytics"
    : null;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <Header
          title="Sentinel"
          subtitle="Analytics and statistics"
          status={{
            connected: true,
            logsPerSecond: 0,
            totalLogs: 0,
          }}
        />

        <div className="border-b border-terminal-border bg-terminal-secondary px-6">
          <Navigation items={navigationItems} />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Spinner variant="blocks" size="lg" text="LOADING ANALYTICS..." />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <Header
        title="Sentinel"
        subtitle="Analytics and statistics"
        status={{
          connected: true,
          logsPerSecond: healthData?.metrics?.logsPerSecond
            ? Math.round(healthData.metrics.logsPerSecond)
            : 0,
          totalLogs: stats.total,
        }}
      />

      <div className="border-b border-terminal-border bg-terminal-secondary px-6">
        <Navigation items={navigationItems} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {errorMessage && (
            <div className="p-4 border border-log-error bg-log-error/10">
              <div className="flex items-center gap-2 text-log-error font-mono text-sm">
                <span>⚠</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

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
                count={stats.byLevel.DEBUG ?? 0}
                total={stats.total}
                color="bg-terminal-muted/50"
              />
              <LevelBar
                level="INFO"
                count={stats.byLevel.INFO ?? 0}
                total={stats.total}
                color="bg-log-info/60"
              />
              <LevelBar
                level="WARN"
                count={stats.byLevel.WARN ?? 0}
                total={stats.total}
                color="bg-log-warn/60"
              />
              <LevelBar
                level="ERROR"
                count={stats.byLevel.ERROR ?? 0}
                total={stats.total}
                color="bg-log-error/60"
              />
              <LevelBar
                level="FATAL"
                count={stats.byLevel.FATAL ?? 0}
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
                  const percentage =
                    stats.total > 0
                      ? ((count / stats.total) * 100).toFixed(1)
                      : "0.0";
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
              <span>Data source: API</span>
              {healthData && (
                <>
                  <span className="text-terminal-border">|</span>
                  <span className="text-terminal-accent">
                    API: {healthData.status}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
