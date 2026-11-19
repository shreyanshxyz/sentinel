export type TimestampFormat = "iso" | "local" | "relative";

function toDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = toDate(iso);
  if (!date) return "—";

  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 1) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimestamp(
  iso: string,
  format: TimestampFormat,
  showMilliseconds: boolean,
): string {
  const date = toDate(iso);
  if (!date) return "—";

  if (format === "iso") {
    const iso = date.toISOString();
    return showMilliseconds ? iso : iso.replace(/\.\d{3}Z$/, "Z");
  }
  if (format === "relative") return formatRelative(iso);

  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...(showMilliseconds ? { fractionalSecondDigits: 3 } : {}),
  });
}
