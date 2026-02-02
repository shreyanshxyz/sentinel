"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { LogEntry } from "@/types/log";

const SSE_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface UseLogStreamOptions {
  onLog?: (log: LogEntry) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseLogStreamReturn {
  isConnected: boolean;
  logsPerSecond: number;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
}

export function useLogStream(
  options: UseLogStreamOptions = {},
): UseLogStreamReturn {
  const {
    onLog,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [logsPerSecond, setLogsPerSecond] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logTimestampsRef = useRef<number[]>([]);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateLogsPerSecond = useCallback(() => {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    logTimestampsRef.current = logTimestampsRef.current.filter(
      (timestamp) => timestamp > oneSecondAgo,
    );

    setLogsPerSecond(logTimestampsRef.current.length);
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      setError(null);

      const url = `${SSE_BASE_URL}/logs/live`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection established");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "log" && data.data) {
            onLog?.(data.data as LogEntry);
            logTimestampsRef.current.push(Date.now());
          } else if (data.type === "status") {
            console.log("SSE status:", data.data);
          } else if (data.type === "error") {
            console.error("SSE error message:", data.data);
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE error:", err);
        setIsConnected(false);
        setError(new Error("Connection lost"));
        onDisconnect?.();
        onError?.(new Error("Connection lost"));

        eventSource.close();
        eventSourceRef.current = null;

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
          );

          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setError(new Error("Max reconnection attempts reached"));
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to connect"));
      onError?.(err instanceof Error ? err : new Error("Failed to connect"));
    }
  }, [
    onLog,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  useEffect(() => {
    metricsIntervalRef.current = setInterval(calculateLogsPerSecond, 1000);

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [calculateLogsPerSecond]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    logsPerSecond,
    error,
    connect,
    disconnect,
  };
}

export function useLogBuffer(maxSize: number = 1000) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bufferRef = useRef<LogEntry[]>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback(
    (log: LogEntry) => {
      bufferRef.current.push(log);

      if (bufferRef.current.length > maxSize * 2) {
        bufferRef.current = bufferRef.current.slice(-maxSize);
      }

      if (bufferRef.current.length >= 50) {
        flush();
      }
    },
    [maxSize],
  );

  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;

    setLogs((prev) => {
      const newLogs = [...prev, ...bufferRef.current];
      if (newLogs.length > maxSize) {
        return newLogs.slice(-maxSize);
      }
      return newLogs;
    });

    bufferRef.current = [];
  }, [maxSize]);

  const clear = useCallback(() => {
    setLogs([]);
    bufferRef.current = [];
  }, []);

  useEffect(() => {
    flushTimerRef.current = setInterval(flush, 100);

    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
      flush();
    };
  }, [flush]);

  return {
    logs,
    addLog,
    clear,
    flush,
  };
}
