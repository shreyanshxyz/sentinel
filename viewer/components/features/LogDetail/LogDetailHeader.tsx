"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LevelLabel } from "@/components/ui/LevelLabel";
import { ArrowLeftIcon, CheckIcon, CopyIcon } from "@/components/ui/icons";
import { LogLevel } from "@/types/log";
import { cn } from "@/lib/utils";

export interface LogDetailHeaderProps {
  logId: string;
  logLevel?: LogLevel | undefined;
  onCopyRaw?: (() => void) | undefined;
  onShare?: (() => void) | undefined;
  onExport?: (() => void) | undefined;
  className?: string;
}

export function LogDetailHeader({
  logId,
  logLevel,
  onCopyRaw,
  onShare,
  onExport,
  className,
}: LogDetailHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(logId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-start justify-between gap-4 px-5 pt-3 pb-[14px]",
        className,
      )}
    >
      <div className="min-w-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11.5px] text-muted transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeftIcon className="h-3 w-3" />
          Logs
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <h1 className="text-[20px] leading-[1.2] font-semibold tracking-[-0.025em] text-ink">
            Event
          </h1>
          {logLevel ? <LevelLabel level={logLevel} /> : null}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy event ID"
            className="group inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-[3px] border border-line bg-sunken px-1.5 py-0.5 font-mono text-[10.5px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
          >
            <span className="truncate">{logId}</span>
            <CopyIcon className="h-2.5 w-2.5 shrink-0 text-faint group-hover:text-ink" />
          </button>
          <span
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-1 text-[10.5px] text-ok transition-opacity duration-150",
              copied ? "opacity-100" : "opacity-0",
            )}
          >
            <CheckIcon className="h-2.5 w-2.5" />
            Copied
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-[7px] pt-0.5">
        <Button variant="secondary" size="md" onClick={onCopyRaw}>
          Copy JSON
        </Button>
        <Button variant="secondary" size="md" onClick={onShare}>
          Share
        </Button>
        <Button variant="secondary" size="md" onClick={onExport}>
          Export
        </Button>
      </div>
    </div>
  );
}

export default LogDetailHeader;
