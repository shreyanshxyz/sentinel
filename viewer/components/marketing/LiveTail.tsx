"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/buttonStyles";

type Level = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
type Filter = "ALL" | Level;

interface TailEvent {
  time: string;
  level: Level;
  source: string;
  message: string;
}

const LEVEL_CLASS: Record<Level, string> = {
  DEBUG: "text-debug",
  INFO: "text-info",
  WARN: "text-warn",
  ERROR: "text-error",
  FATAL: "text-fatal",
};

const LEVELS: Level[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

const EVENTS: TailEvent[] = [
  {
    time: "14:32:07.431",
    level: "INFO",
    source: "auth-service",
    message: "Session refreshed",
  },
  {
    time: "14:32:07.982",
    level: "DEBUG",
    source: "worker-service",
    message: "Job queue drained in 42ms",
  },
  {
    time: "14:32:08.204",
    level: "ERROR",
    source: "payment-service",
    message: "Database connection failed: timeout after 5000ms",
  },
  {
    time: "14:32:08.766",
    level: "INFO",
    source: "checkout-service",
    message: "Cart priced",
  },
  {
    time: "14:32:09.118",
    level: "WARN",
    source: "api-gateway",
    message: "Rate limit reached for client",
  },
  {
    time: "14:32:09.640",
    level: "INFO",
    source: "notifications-service",
    message: "Email batch delivered",
  },
  {
    time: "14:32:10.027",
    level: "ERROR",
    source: "auth-service",
    message: "Token validation failed: signature mismatch",
  },
  {
    time: "14:32:10.419",
    level: "DEBUG",
    source: "api-gateway",
    message: "Route cache hit for GET /v1/orders",
  },
  {
    time: "14:32:10.855",
    level: "WARN",
    source: "inventory-service",
    message: "Stock level below reorder point for SKU-1184",
  },
  {
    time: "14:32:11.302",
    level: "INFO",
    source: "shipping-service",
    message: "Carrier API returned 503, retrying shipment batch",
  },
  {
    time: "14:32:11.744",
    level: "FATAL",
    source: "worker-service",
    message: "Out of memory while processing job batch",
  },
  {
    time: "14:32:12.091",
    level: "WARN",
    source: "checkout-service",
    message: "Payment provider latency above threshold",
  },
];

const MIN_LOOP_ROWS = 12;

export function LiveTail() {
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = useMemo(() => {
    const tally = { ALL: EVENTS.length } as Record<Filter, number>;
    for (const level of LEVELS) {
      tally[level] = EVENTS.filter((event) => event.level === level).length;
    }
    return tally;
  }, []);

  const rows = useMemo(() => {
    const matching =
      filter === "ALL"
        ? EVENTS
        : EVENTS.filter((event) => event.level === filter);
    const repeats = Math.max(1, Math.ceil(MIN_LOOP_ROWS / matching.length));
    const half = Array.from({ length: repeats }, () => matching).flat();
    return [...half, ...half];
  }, [filter]);

  return (
    <section
      aria-labelledby="live-tail-heading"
      className="border-y border-line bg-sunken"
    >
      <div className="mx-auto max-w-[1180px] px-5 py-14 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-mono text-[9.5px] tracking-[.09em] text-faint uppercase">
              <span
                aria-hidden
                className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-ok"
              />
              Live tail
            </p>
            <h2
              id="live-tail-heading"
              className="mt-3 text-[clamp(1.35rem,2.4vw,1.7rem)] leading-[1.15] font-semibold tracking-[-0.025em] text-ink"
            >
              Events as they arrive.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
            className={buttonClass("secondary", "sm", "btn-lift")}
          >
            {paused ? "Resume stream" : "Pause stream"}
          </button>
        </div>

        <div className="mt-6 -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 md:[mask-image:none]">
          {(["ALL", ...LEVELS] as Filter[]).map((option) => {
            const active = filter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={active}
                className={cn(
                  "inline-flex shrink-0 items-baseline gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[.05em] whitespace-nowrap uppercase transition-colors duration-150",
                  active
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {option === "ALL" ? "All" : option}
                <span
                  className={cn(
                    "text-[9.5px] tabular-nums",
                    active ? "text-canvas/60" : "text-faint",
                  )}
                >
                  {counts[option]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="tail-frame mt-4 overflow-hidden rounded-[6px] border border-line bg-canvas">
          <div className="tail-mask h-[272px] overflow-hidden">
            <div key={filter} className="swap-in">
              <div className={cn("tail-track", paused && "is-paused")}>
                {rows.map((event, index) => (
                  <div
                    key={`${event.time}-${index}`}
                    className="grid grid-cols-[78px_52px_1fr] items-baseline gap-3 border-b border-line px-4 py-2.5 md:grid-cols-[86px_56px_160px_1fr] md:gap-4"
                  >
                    <span className="font-mono text-[10.5px] text-faint">
                      {event.time}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[10px] tracking-[.04em] uppercase",
                        LEVEL_CLASS[event.level],
                      )}
                    >
                      {event.level}
                    </span>
                    <span className="hidden font-mono text-[11px] text-muted md:block">
                      {event.source}
                    </span>
                    <span className="truncate text-[12px] text-ink-2">
                      {event.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11.5px] text-muted">
          Seeded events, delivered over{" "}
          <code className="font-mono text-[11px] text-ink-2">GET /logs/live</code>
          .
        </p>
      </div>
    </section>
  );
}

export default LiveTail;
