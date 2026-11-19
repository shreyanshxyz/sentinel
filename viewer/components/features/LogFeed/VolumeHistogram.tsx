"use client";

import type { LogEntry } from "@/types/log";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";

export interface VolumeHistogramProps {
  logs: LogEntry[];
  minutes?: number;
  className?: string;
}

interface Bucket {
  start: number;
  count: number;
  tone: "neutral" | "warn" | "err";
}

const TONE_CLASS = {
  neutral: "bg-hist",
  warn: "bg-hist-warn",
  err: "bg-hist-err",
} as const;

function minuteLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VolumeHistogram({
  logs,
  minutes = 60,
  className,
}: VolumeHistogramProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const model = useMemo(() => {
    const bucketMs = 60_000;
    const end = Math.floor(now / bucketMs) * bucketMs;
    const start = end - (minutes - 1) * bucketMs;
    const buckets: Bucket[] = Array.from({ length: minutes }, (_, index) => ({
      start: start + index * bucketMs,
      count: 0,
      tone: "neutral",
    }));

    for (const log of logs) {
      const time = new Date(log.timestamp).getTime();
      if (!Number.isFinite(time) || time < start) continue;
      const index = Math.floor((time - start) / bucketMs);
      if (index < 0 || index >= buckets.length) continue;

      const bucket = buckets[index];
      if (!bucket) continue;
      bucket.count += 1;

      if (log.level === "FATAL" || log.level === "ERROR") {
        bucket.tone = "err";
      } else if (log.level === "WARN" && bucket.tone !== "err") {
        bucket.tone = "warn";
      }
    }

    let peak = 0;
    let peakStart = 0;
    for (const bucket of buckets) {
      if (bucket.count > peak) {
        peak = bucket.count;
        peakStart = bucket.start;
      }
    }

    return { buckets, peak, peakStart };
  }, [logs, minutes, now]);

  const hasEvents = model.peak > 0;

  return (
    <section className={cn("px-5 pt-2.5 pb-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold tracking-[.07em] text-faint uppercase">
            Events per minute
          </span>
          <span className="text-[10.5px] text-faint">
            last {minutes} minutes · in-memory sample
          </span>
        </div>
        <span className="font-mono text-[10px] whitespace-nowrap text-faint tabular-nums">
          {hasEvents
            ? `peak ${model.peak} / min · ${minuteLabel(model.peakStart)}`
            : "No events yet"}
        </span>
      </div>

      <div
        className="mt-2 flex h-[34px] items-end gap-px"
        role="img"
        aria-label={
          hasEvents
            ? `Event volume for the last ${minutes} minutes. Peak ${model.peak} events per minute.`
            : `No events in the last ${minutes} minutes.`
        }
      >
        {model.buckets.map((bucket) => {
          const height = hasEvents
            ? bucket.count === 0
              ? 1
              : Math.max(2, Math.round((bucket.count / model.peak) * 34))
            : 1;

          return (
            <div
              key={bucket.start}
              title={`${minuteLabel(bucket.start)} · ${bucket.count} events`}
              className={cn(
                "min-w-px flex-1 rounded-t-[1px]",
                bucket.count === 0 ? "bg-line" : TONE_CLASS[bucket.tone],
              )}
              style={{ height }}
            />
          );
        })}
      </div>
    </section>
  );
}

export default VolumeHistogram;
