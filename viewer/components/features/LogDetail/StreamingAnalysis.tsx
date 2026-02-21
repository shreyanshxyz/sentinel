"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import { Spinner } from "../../ui/Spinner";
import { cn } from "../../../lib/utils";
import { AIInsight } from "@/types/log";

export interface StreamingAnalysisProps {
  logId: string;
  error?: string | null;
}

export const StreamingAnalysis: React.FC<StreamingAnalysisProps> = ({
  logId,
  error: errorProp,
}) => {
  const [streaming, setStreaming] = useState(true);
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<AIInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const highlightJSON = (json: string): React.ReactNode => {
    const lines = json.split("\n");
    return (
      <>
        {lines.map((line, i) => {
          const highlighted = line
            .replace(/"([^"]+)":/g, '<span class="text-cyan-400">"$1"</span>:')
            .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
            .replace(/: (\d+\.?\d*)/g, ': <span class="text-orange-400">$1</span>')
            .replace(/: (true|false)/g, ': <span class="text-blue-400">$1</span>')
            .replace(/: (null)/g, ': <span class="text-blue-400">$1</span>');
          return (
            <span key={i}>
              <span dangerouslySetInnerHTML={{ __html: highlighted }} />
              {i < lines.length - 1 && "\n"}
            </span>
          );
        })}
      </>
    );
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: "text-log-info border-log-info/40",
      medium: "text-log-warn border-log-warn/40",
      high: "text-log-error border-log-error/40",
      critical: "text-log-fatal border-log-fatal/40",
    };
    return colors[severity] || "text-terminal-muted border-terminal-border";
  };

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    if (isMountedRef.current) {
      startStreaming();
    }
  }, []);

  const startStreaming = useCallback(() => {
    if (!logId || !isMountedRef.current) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStreaming(true);
    setContent("");
    setAnalysis(null);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const eventSource = new EventSource(`${apiUrl}/logs/${logId}/analyze-stream`);

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
            console.log("[StreamingAnalysis] Analysis started for log:", data.logId);
            break;

          case "chunk":
            setContent((prev) => prev + data.content);
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
            startStreaming();
          }
        }, 2000);
      } else if (isMountedRef.current) {
        setError("Connection failed. Please try again.");
        setStreaming(false);
      }
    };
  }, [logId]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (logId) {
      startStreaming();
    }

    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [logId, startStreaming]);

  if (errorProp || error) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <div className="text-log-error text-center space-y-2">
            <p className="text-sm font-mono">Analysis failed to connect</p>
            <p className="text-xs text-terminal-muted">
              {errorProp || error || "Unknown error occurred"}
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-terminal-accent text-black rounded hover:bg-green-600 transition-colors font-mono text-sm"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (streaming && !content && !analysis) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Spinner variant="blocks" size="lg" text="CONNECTING..." />
          <p className="text-terminal-muted text-sm font-mono">
            Connecting to AI Worker...
          </p>
        </div>
      </div>
    );
  }

  if (streaming) {
    return (
      <Card variant="default" padding="lg" className="min-h-100 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-purple-400">[</span>
              <span className="text-terminal-muted uppercase tracking-wider text-xs">
                AI Analysis
              </span>
              <span className="text-purple-400">]</span>
            </CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              LIVE STREAMING
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
                <span className="text-purple-400">[</span>
                <span>Analysis</span>
                <span className="text-purple-400">]</span>
              </div>
              <div className="font-mono leading-relaxed text-sm">
                <pre className="whitespace-pre-wrap break-words text-text-primary">
                  {highlightJSON(content)}
                  <span className="terminal-cursor">█</span>
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis) {
    return (
      <Card variant="default" padding="lg" className="min-h-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-purple-400">[</span>
              <span className="text-terminal-muted uppercase tracking-wider text-xs">
                AI Analysis
              </span>
              <span className="text-purple-400">]</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {analysis.modelVersion && (
                <Badge variant="outline" className="text-xs font-mono text-terminal-muted">
                  {analysis.modelVersion}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-mono",
                  analysis.severity === "critical" && "border-log-fatal/50 text-log-fatal",
                  analysis.severity === "high" && "border-log-error/50 text-log-error",
                  analysis.severity === "medium" && "border-log-warn/50 text-log-warn",
                  analysis.severity === "low" && "border-log-info/50 text-log-info",
                )}
              >
                {analysis.severity.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          {analysis.confidence !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
                <span className="text-purple-400">[</span>
                <span>Confidence</span>
                <span className="text-purple-400">]</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-terminal-input rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      analysis.confidence >= 0.7 ? "bg-green-500" : "bg-yellow-500"
                    )}
                    style={{ width: `${Math.round(analysis.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-terminal-muted">
                  {Math.round(analysis.confidence * 100)}%
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
              <span className="text-purple-400">[</span>
              <span>Summary</span>
              <span className="text-purple-400">]</span>
            </div>
            <div className="pl-3 border-l border-purple-400/30">
              <p className="text-sm text-text-primary font-mono leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
              <span className="text-purple-400">[</span>
              <span>Root Cause</span>
              <span className="text-purple-400">]</span>
            </div>
            <div className="pl-3 border-l border-purple-400/30">
              <div className="bg-terminal-input/50 p-3 border border-purple-400/20 rounded">
                <p className="text-sm text-text-primary font-mono leading-relaxed">
                  {analysis.rootCause}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
              <span className="text-purple-400">[</span>
              <span>Suggested Follow-ups</span>
              <span className="text-purple-400">]</span>
            </div>
            <div className="space-y-2 pl-3 border-l border-purple-400/30">
              {analysis.followUps && analysis.followUps.length > 0 ? (
                analysis.followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="bg-terminal-input/30 p-3 border border-terminal-border rounded"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-mono text-terminal-muted uppercase tracking-wider">
                          {followUp.title}
                        </p>
                        <p className="text-sm text-text-primary font-mono leading-relaxed mt-1">
                          {followUp.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-mono",
                          getSeverityColor(followUp.priority),
                        )}
                      >
                        {followUp.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-terminal-muted font-mono">
                  No follow-up actions available
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
