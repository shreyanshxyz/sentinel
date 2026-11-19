import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "live" | "paused" | "error";

const toneStyles: Record<StatusTone, { text: string; dot: string }> = {
  live: { text: "text-ok", dot: "bg-ok" },
  paused: { text: "text-muted", dot: "bg-muted" },
  error: { text: "text-error", dot: "bg-error" },
};

export interface StatusChipProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}

export function StatusChip({ tone, children, className }: StatusChipProps) {
  const styles = toneStyles[tone];

  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center gap-1.5 rounded-[3px] border border-line px-1.5 text-[9.5px] font-semibold tracking-[.05em] uppercase whitespace-nowrap",
        styles.text,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-[5px] w-[5px] rounded-full",
          styles.dot,
          tone === "live" && "live-dot",
        )}
      />
      {children}
    </span>
  );
}

export default StatusChip;
