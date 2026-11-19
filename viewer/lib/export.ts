import type { LogEntry } from "@/types/log";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function fileStamp(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

export function downloadLogs(logs: LogEntry[], prefix = "sentinel-logs"): void {
  if (typeof window === "undefined") return;

  const json = JSON.stringify(logs, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${prefix}-${fileStamp(new Date())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
