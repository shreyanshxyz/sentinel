"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StatusChip } from "@/components/ui/StatusChip";
import { Tag } from "@/components/ui/Tag";
import { getApiBaseUrl } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { AIInsight } from "@/types/log";

export interface StreamingAnalysisProps {
  logId: string;
  error?: string | null;
}

interface StreamingState {
  summary: string;
  rootCause: string;
  severity: string;
  confidence: number;
  patterns: string[];
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    type: string;
  }>;
}

interface FollowUp {
  title: string;
  description: string;
  priority: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  low: "text-muted",
  medium: "text-warn",
  high: "text-error",
  critical: "text-fatal",
};

function priorityClass(priority: string): string {
  return PRIORITY_COLOR[priority.toLowerCase()] ?? "text-muted";
}

function Section({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold tracking-[.08em] text-faint uppercase">
        {label}
      </h3>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function StreamingAnalysis({
  logId,
  error: errorProp,
}: StreamingAnalysisProps) {
  const [streaming, setStreaming] = useState(true);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    summary: "",
    rootCause: "",
    severity: "low",
    confidence: 0,
    patterns: [],
    recommendations: [],
  });
  const [analysis, setAnalysis] = useState<AIInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const parseStreamingJson = (jsonStr: string): StreamingState => {
    const state: StreamingState = {
      summary: "",
      rootCause: "",
      severity: "low",
      confidence: 0,
      patterns: [],
      recommendations: [],
    };

    try {
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.summary) state.summary = parsed.summary;
        if (parsed.root_cause) state.rootCause = parsed.root_cause;
        if (parsed.severity) state.severity = parsed.severity;
        if (parsed.confidence) state.confidence = parsed.confidence;
        if (parsed.patterns) state.patterns = parsed.patterns;
        if (parsed.recommendations) state.recommendations = parsed.recommendations;
      }
    } catch {
      // Still building JSON, return current state
    }

    return state;
  };

  const rawContentRef = useRef<string>("");
  const startStreamingRef = useRef<(() => void) | null>(null);

  const startStreaming = useCallback(() => {
    if (!logId || !isMountedRef.current) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStreaming(true);
    rawContentRef.current = "";
    setStreamingState({
      summary: "",
      rootCause: "",
      severity: "low",
      confidence: 0,
      patterns: [],
      recommendations: [],
    });
    setAnalysis(null);
    setError(null);

    const eventSource = new EventSource(
      `${getApiBaseUrl()}/logs/${logId}/analyze-stream`,
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[StreamingAnalysis] SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      if (!isMountedRef.current) return;

      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "start":
            console.log(
              "[StreamingAnalysis] Analysis started for log:",
              data.logId,
            );
            break;

          case "chunk":
            rawContentRef.current += data.content;
            setStreamingState(parseStreamingJson(rawContentRef.current));
            break;

          case "analysis":
            console.log("[StreamingAnalysis] Analysis complete:", data.analysis);
            setAnalysis(data.analysis);
            setStreaming(false);
            eventSource.close();
            break;

          case "error":
            console.error("[StreamingAnalysis] Analysis error:", data.error);
            setError(data.error);
            setStreaming(false);
            eventSource.close();
            break;

          default:
            console.warn("[StreamingAnalysis] Unknown event type:", data.type);
        }
      } catch (err) {
        console.error("[StreamingAnalysis] Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("[StreamingAnalysis] SSE connection error");
      if (retryCountRef.current < 3 && isMountedRef.current) {
        retryCountRef.current += 1;
        setTimeout(() => {
          if (isMountedRef.current) {
            startStreamingRef.current?.();
          }
        }, 2000);
      } else if (isMountedRef.current) {
        setError("Connection failed. Please try again.");
        setStreaming(false);
      }
    };
  }, [logId]);

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    if (isMountedRef.current) {
      startStreaming();
    }
  }, [startStreaming]);

  useEffect(() => {
    isMountedRef.current = true;
    startStreamingRef.current = startStreaming;

    if (logId) {
      // Kick the stream off after the effect body so the connection setup
      // does not cascade renders during the commit phase.
      queueMicrotask(() => {
        if (isMountedRef.current) {
          startStreamingRef.current?.();
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [logId, startStreaming]);

  const failure = errorProp || error;
  const confidence = analysis?.confidence ?? streamingState.confidence;
  const patterns = analysis?.patterns ?? streamingState.patterns;
  const followUps: FollowUp[] = analysis
    ? analysis.followUps.map((item) => ({
        title: item.title,
        description: item.description,
        priority: item.priority,
      }))
    : streamingState.recommendations;
  const summary = analysis?.summary ?? streamingState.summary;
  const rootCause = analysis?.rootCause ?? streamingState.rootCause;
  const isConnecting = streaming && !summary && !rootCause && !failure;

  const stateLabel = failure ? "Failed" : streaming ? "Streaming" : "Complete";
  const stateTone = failure ? "error" : streaming ? "live" : "paused";
  const generatedAt = analysis?.createdAt ? new Date(analysis.createdAt) : null;
  const generatedLabel =
    generatedAt && !Number.isNaN(generatedAt.getTime())
      ? generatedAt.toLocaleTimeString("en-US", { hour12: false })
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <h2 className="text-[11px] font-semibold text-ink">AI analysis</h2>
        <StatusChip tone={stateTone}>{stateLabel}</StatusChip>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {failure ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-[12px] font-medium text-ink">
              Analysis unavailable
            </p>
            <p className="text-[11.5px] leading-[1.5] text-muted">
              {failure || "Unknown error occurred"}
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-1.5"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        ) : isConnecting ? (
          <div className="flex items-center gap-2 text-[11.5px] text-muted">
            <Spinner size="sm" />
            Connecting to analysis…
          </div>
        ) : (
          <div className="space-y-5">
            {confidence > 0 ? (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold tracking-[.08em] text-faint uppercase">
                    Confidence
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-2 tabular-nums">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 h-[2px] bg-sunken">
                  <div
                    className="h-full bg-ink transition-all duration-300"
                    style={{ width: `${Math.round(confidence * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}

            {summary ? (
              <Section label="Summary">
                <p className="text-[12px] leading-[1.55] text-ink-2">
                  {summary}
                  {streaming ? (
                    <span
                      aria-hidden
                      className="ml-0.5 inline-block h-[10px] w-[2px] translate-y-[1px] bg-ok"
                    />
                  ) : null}
                </p>
              </Section>
            ) : null}

            {rootCause ? (
              <Section label="Root cause">
                <p className="text-[12px] leading-[1.55] text-ink-2">
                  {rootCause}
                </p>
              </Section>
            ) : null}

            {patterns.length > 0 ? (
              <Section label="Patterns">
                <div className="flex flex-wrap gap-1">
                  {patterns.map((pattern, index) => (
                    <Tag key={`${pattern}-${index}`}>{pattern}</Tag>
                  ))}
                </div>
              </Section>
            ) : null}

            {followUps.length > 0 ? (
              <Section label="Suggested follow-ups">
                <ul className="mt-0.5">
                  {followUps.map((followUp, index) => (
                    <li
                      key={`${followUp.title}-${index}`}
                      className="border-b border-line py-2.5 last:border-b-0"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] font-medium text-ink">
                          {followUp.title}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[9px] font-semibold tracking-[.05em] uppercase",
                            priorityClass(followUp.priority),
                          )}
                        >
                          {followUp.priority}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">
                        {followUp.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>
        )}
      </div>

      {analysis && (analysis.modelVersion || generatedLabel) ? (
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2 text-[10px] text-faint">
          {analysis.modelVersion ? (
            <span className="font-mono">{analysis.modelVersion}</span>
          ) : null}
          {generatedLabel ? <span>Generated {generatedLabel}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export default StreamingAnalysis;
