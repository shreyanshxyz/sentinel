"use client";

import { useParams, useRouter } from "next/navigation";
import { LogDetailHeader } from "@/components/features/LogDetail/LogDetailHeader";
import { LogMetadataPanel } from "@/components/features/LogDetail/LogMetadataPanel";
import { LogRawView } from "@/components/features/LogDetail/LogRawView";
import { StreamingAnalysis } from "@/components/features/LogDetail/StreamingAnalysis";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useLog, useLogAnalysis } from "@/hooks/useQueries";
import { APIError } from "@/lib/api";

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;

  const { data: log, isLoading: isLogLoading, error: logError } = useLog(logId);
  const { data: aiInsight } = useLogAnalysis(logId);

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

  void aiInsight;

  if (isLogLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-2 px-5 pt-3 pb-3.5">
          <div className="h-3 w-10 rounded-[2px] bg-sunken" />
          <div className="h-5 w-20 rounded-[2px] bg-sunken" />
          <div className="h-3 w-56 rounded-[2px] bg-sunken" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="md" label="Loading event…" />
        </div>
      </div>
    );
  }

  if (logError) {
    const errorMessage =
      logError instanceof APIError
        ? logError.message
        : "Failed to load event data.";
    const errorCode =
      logError instanceof APIError ? logError.code : "UNKNOWN_ERROR";

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHead title="Event" subtitle="Event unavailable" />
        <div className="flex flex-1 items-center justify-center px-5 pb-10">
          <div className="w-full max-w-[440px] rounded-[5px] border border-line p-6">
            <h2 className="text-[13px] font-semibold text-ink">
              Could not load this event
            </h2>
            <p className="mt-2 text-[11.5px] leading-[1.5] text-muted">
              {errorMessage}
            </p>
            <p className="mt-1 font-mono text-[10.5px] text-faint">
              {errorCode}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                Back to logs
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHead title="Event" subtitle="Event not found" />
        <div className="flex flex-1 items-center justify-center px-5 pb-10">
          <div className="w-full max-w-[440px] rounded-[5px] border border-line p-6">
            <h2 className="text-[13px] font-semibold text-ink">
              Event not found
            </h2>
            <p className="mt-2 text-[11.5px] leading-[1.5] text-muted">
              No log with ID{" "}
              <span className="font-mono text-[11px] text-ink-2">{logId}</span>{" "}
              exists in this store.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/dashboard")}
            >
              Back to logs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LogDetailHeader
        logId={logId}
        logLevel={log.level}
        onCopyRaw={handleCopyRaw}
        onShare={handleShare}
        onExport={handleExport}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-line min-[1100px]:flex-row min-[1100px]:overflow-hidden">
        <main className="min-w-0 flex-1 min-[1100px]:overflow-y-auto">
          <LogMetadataPanel log={log} />
          <LogRawView log={log} />
        </main>

        <aside className="h-[460px] shrink-0 border-t border-line bg-canvas min-[1100px]:h-auto min-[1100px]:w-[380px] min-[1100px]:border-t-0 min-[1100px]:border-l">
          <StreamingAnalysis logId={logId} />
        </aside>
      </div>
    </div>
  );
}
