import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { LogEntry, LogFilter, AIInsight, LogSource } from "@/types/log";
import { HealthResponse, SearchResponse } from "@/types/api";

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

export function useAnalytics(timeRange: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics(timeRange),
    queryFn: () => apiClient.getAnalytics(timeRange),
    enabled,
  });
}
