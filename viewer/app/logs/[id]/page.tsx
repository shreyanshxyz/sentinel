"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogDetailHeader } from "@/components/features/LogDetail/LogDetailHeader";
import { LogMetadataPanel } from "@/components/features/LogDetail/LogMetadataPanel";
import { LogRawView } from "@/components/features/LogDetail/LogRawView";
import { AIInsightCard } from "@/components/features/LogDetail/AIInsightCard";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { FollowUpAction } from "@/types/log";
import { useLog, useLogAnalysis, useTriggerAnalysis } from "@/hooks/useQueries";
import { APIError } from "@/lib/api";

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;

  const { data: log, isLoading: isLogLoading, error: logError } = useLog(logId);

  const {
    data: aiInsight,
    isLoading: isAnalysisLoading,
    error: analysisError,
  } = useLogAnalysis(logId);

  const triggerAnalysis = useTriggerAnalysis();

  const handleCopyRaw = () => {
    if (log?.raw) {
      navigator.clipboard.writeText(log.raw);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleExport = () => {
    if (log) {
      const data = JSON.stringify(log, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${logId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleFollowUpClick = (action: FollowUpAction) => {
    console.log("Follow-up action clicked:", action);
    alert(`Action: ${action.title}\n${action.description}`);
  };

  const handleTriggerAnalysis = useCallback(() => {
    triggerAnalysis.mutate(logId);
  }, [logId, triggerAnalysis]);

  if (isLogLoading) {
    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <div className="flex-1 flex items-center justify-center">
          <Spinner variant="blocks" size="lg" text="LOADING LOG..." />
        </div>
      </div>
    );
  }

  if (logError) {
    const errorMessage =
      logError instanceof APIError
        ? logError.message
        : "Failed to load log data";
    const errorCode =
      logError instanceof APIError ? logError.code : "UNKNOWN_ERROR";

    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-log-error text-4xl font-mono">ERROR</div>
            <p className="text-terminal-muted font-mono">{errorMessage}</p>
            <p className="text-terminal-muted font-mono text-sm">
              Error Code: {errorCode}
            </p>
            <div className="space-x-4 mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-terminal-border bg-terminal-input hover:border-terminal-accent hover:bg-terminal-border transition-colors font-mono text-sm"
              >
                [ RETRY ]
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 border border-terminal-border bg-terminal-input hover:border-terminal-accent hover:bg-terminal-border transition-colors font-mono text-sm"
              >
                [ RETURN TO HOME ]
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-log-error text-4xl font-mono">NOT FOUND</div>
            <p className="text-terminal-muted font-mono">
              Log with ID &quot;{logId}&quot; not found
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 border border-terminal-border bg-terminal-input hover:border-terminal-accent hover:bg-terminal-border transition-colors font-mono text-sm"
            >
              [ RETURN TO HOME ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <LogDetailHeader
        logId={logId}
        logLevel={log.level}
        onCopyRaw={handleCopyRaw}
        onShare={handleShare}
        onExport={handleExport}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <LogMetadataPanel log={log} />
          <LogRawView log={log} className="flex-1 min-h-100" />
        </div>

        <div className="w-100 border-l border-terminal-border bg-terminal-secondary overflow-y-auto hidden lg:block">
          <div className="p-4 h-full space-y-4">
            {aiInsight ? (
              <AIInsightCard
                insight={aiInsight}
                isLoading={isAnalysisLoading}
                onFollowUpClick={handleFollowUpClick}
              />
            ) : analysisError ? (
              <div className="p-4 border border-log-error bg-terminal-input">
                <div className="text-log-error font-mono text-sm mb-2">
                  Analysis Error
                </div>
                <p className="text-terminal-muted font-mono text-xs">
                  {analysisError instanceof APIError
                    ? analysisError.message
                    : "Failed to load AI analysis"}
                </p>
                <Button
                  variant="terminal"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={handleTriggerAnalysis}
                  disabled={triggerAnalysis.isPending}
                >
                  {triggerAnalysis.isPending
                    ? "ANALYZING..."
                    : "RETRY ANALYSIS"}
                </Button>
              </div>
            ) : (
              <div className="p-4 border border-terminal-border bg-terminal-input">
                <div className="text-terminal-muted font-mono text-sm mb-2">
                  No AI Analysis Available
                </div>
                <p className="text-terminal-muted font-mono text-xs mb-4">
                  This log hasn&apos;t been analyzed yet. Trigger an analysis to
                  get AI-powered insights.
                </p>
                <Button
                  variant="terminal"
                  size="sm"
                  className="w-full"
                  onClick={handleTriggerAnalysis}
                  disabled={triggerAnalysis.isPending}
                >
                  {triggerAnalysis.isPending
                    ? "ANALYZING..."
                    : "TRIGGER ANALYSIS"}
                </Button>
              </div>
            )}

            {aiInsight && (
              <div className="p-4 border border-terminal-border bg-terminal-input">
                <div className="text-terminal-accent font-mono text-sm mb-2">
                  ANALYSIS METADATA
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Confidence:</span>
                    <span
                      className={`font-bold ${
                        aiInsight.confidence >= 0.8
                          ? "text-log-success"
                          : aiInsight.confidence >= 0.6
                            ? "text-log-warn"
                            : "text-log-error"
                      }`}
                    >
                      {Math.round(aiInsight.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Severity:</span>
                    <span
                      className={`font-bold ${
                        aiInsight.severity === "critical"
                          ? "text-log-error"
                          : aiInsight.severity === "high"
                            ? "text-log-warn"
                            : aiInsight.severity === "medium"
                              ? "text-log-info"
                              : "text-log-success"
                      }`}
                    >
                      {aiInsight.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Patterns:</span>
                    <span className="text-text-primary">
                      {aiInsight.patterns.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Related Logs:</span>
                    <span className="text-text-primary">
                      {aiInsight.relatedLogs.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Created:</span>
                    <span className="text-text-primary">
                      {new Date(aiInsight.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:hidden border-t border-terminal-border bg-terminal-secondary p-4">
        {aiInsight ? (
          <AIInsightCard
            insight={aiInsight}
            isLoading={isAnalysisLoading}
            onFollowUpClick={handleFollowUpClick}
          />
        ) : (
          <div className="p-4 border border-terminal-border bg-terminal-input">
            <div className="text-terminal-muted font-mono text-sm mb-2">
              ℹ No AI Analysis Available
            </div>
            <Button
              variant="terminal"
              size="sm"
              className="w-full"
              onClick={handleTriggerAnalysis}
              disabled={triggerAnalysis.isPending}
            >
              {triggerAnalysis.isPending ? "ANALYZING..." : "TRIGGER ANALYSIS"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
