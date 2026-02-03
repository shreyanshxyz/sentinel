import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { LogFilter, AIInsight } from "@/types/log";
import { useEffect, useRef, useState } from "react";

export const queryKeys = {
  logs: ["logs"] as QueryKey,
  log: (id: string) => ["logs", id] as QueryKey,
  logAnalysis: (id: string) => ["logs", id, "analysis"] as QueryKey,
  search: (filter: LogFilter) => ["logs", "search", filter] as QueryKey,
  sources: ["sources"] as QueryKey,
  health: ["health"] as QueryKey,
  analytics: (range: string) => ["analytics", range] as QueryKey,
};

export function useLogs(filter?: LogFilter, enabled = true) {
  return useQuery({
    queryKey: queryKeys.logs,
    queryFn: () => apiClient.getLogs(filter),
    enabled,
  });
}

export function useLog(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.log(id),
    queryFn: () => apiClient.getLogById(id),
    enabled: enabled && !!id,
  });
}

export function useSearchLogs(filter: LogFilter, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search(filter),
    queryFn: () => apiClient.searchLogs(filter),
    enabled,
  });
}

export function useSources(enabled = true) {
  return useQuery({
    queryKey: queryKeys.sources,
    queryFn: () => apiClient.getSources(),
    enabled,
  });
}

export function useHealth(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.getHealth(),
    refetchInterval: options?.refetchInterval ?? 30000,
    retry: 1,
  });
}

export function useLogAnalysis(logId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.logAnalysis(logId),
    queryFn: () => apiClient.getLogAnalysis(logId),
    enabled: enabled && !!logId,
  });
}

export function useTriggerAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => apiClient.triggerAnalysis(logId),
    onSuccess: (data, logId) => {
      queryClient.setQueryData(queryKeys.logAnalysis(logId), data);
    },
  });
}

export function useStreamingAnalysis(logId: string) {
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<AIInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!logId) return;

    setStreaming(true);
    setContent("");
    setAnalysis(null);
    setError(null);

    const { eventSource, controller } = apiClient.streamAnalysis(logId);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "start":
            console.log("Analysis started for log:", data.logId);
            break;

          case "chunk":
            setContent((prev) => prev + data.content);
            break;

          case "analysis":
            console.log("Analysis complete:", data.analysis);
            setAnalysis(data.analysis);
            setStreaming(false);
            eventSource.close();
            break;

          case "error":
            console.error("Analysis error:", data.error);
            setError(data.error);
            setStreaming(false);
            eventSource.close();
            break;

          default:
            console.warn("Unknown event type:", data.type);
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      setError("Connection failed. Please try again.");
      setStreaming(false);
    };

    eventSource.onclose = () => {
      console.log("SSE connection closed");
      setStreaming(false);
    };

    return () => {
      eventSource.close();
      controller.abort();
      eventSourceRef.current = null;
    };
  }, [logId]);

  return {
    streaming,
    content,
    analysis,
    error,
    close: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    },
  };
}

export function useAnalytics(timeRange: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics(timeRange),
    queryFn: () => apiClient.getAnalytics(timeRange),
    enabled,
  });
}
