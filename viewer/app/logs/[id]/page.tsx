"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogDetailHeader } from "@/components/features/LogDetail/LogDetailHeader";
import { LogMetadataPanel } from "@/components/features/LogDetail/LogMetadataPanel";
import { LogRawView } from "@/components/features/LogDetail/LogRawView";
import { AIInsightCard } from "@/components/features/LogDetail/AIInsightCard";
import { Spinner } from "@/components/ui/Spinner";
import { LogEntry, AIInsight, FollowUpAction } from "@/types/log";
import { generateMockLogEntry, generateMockAIInsight } from "@/lib/mock-data";

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;

  const [log, setLog] = useState<LogEntry | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockLog = generateMockLogEntry({
          id: logId,
        });
        setLog(mockLog);

        setIsAiLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockInsight = generateMockAIInsight(logId, mockLog.level);
        setAiInsight(mockInsight);
        setIsAiLoading(false);
      } catch (err) {
        setError("Failed to load log data");
        console.error("Error fetching log:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogData();
  }, [logId]);

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

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <div className="flex-1 flex items-center justify-center">
          <Spinner variant="blocks" size="lg" text="LOADING LOG..." />
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="h-screen flex flex-col bg-terminal-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-log-error text-4xl font-mono">ERROR</div>
            <p className="text-terminal-muted font-mono">
              {error || "Log not found"}
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
          <div className="p-4 h-full">
            <AIInsightCard
              insight={aiInsight!}
              isLoading={isAiLoading}
              onFollowUpClick={handleFollowUpClick}
            />
          </div>
        </div>
      </div>

      <div className="lg:hidden border-t border-terminal-border bg-terminal-secondary p-4">
        <AIInsightCard
          insight={aiInsight!}
          isLoading={isAiLoading}
          onFollowUpClick={handleFollowUpClick}
        />
      </div>
    </div>
  );
}
