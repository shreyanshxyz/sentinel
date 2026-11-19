"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CopyIcon } from "@/components/ui/icons";
import { LogEntry } from "@/types/log";

export interface LogRawViewProps {
  log: LogEntry;
  className?: string;
}

export function LogRawView({ log, className }: LogRawViewProps) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const rawContent = log.raw || JSON.stringify(log, null, 2);
  const lines = rawContent.split("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-4 px-5 py-4 pb-2">
        <h2 className="text-[10px] font-semibold tracking-[.08em] text-faint uppercase">
          Raw
        </h2>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLineNumbers((value) => !value)}
            aria-pressed={showLineNumbers}
          >
            {showLineNumbers ? "Hide line numbers" : "Show line numbers"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            <CopyIcon className="h-3 w-3" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="px-5">
        <div className="max-h-[420px] overflow-auto rounded-[5px] border border-line bg-sunken py-2.5">
          <pre className="font-mono text-[11px] leading-[1.6]">
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex px-2 transition-colors duration-100 hover:bg-hover"
              >
                {showLineNumbers ? (
                  <span className="w-9 shrink-0 border-r border-line pr-2.5 text-right text-[10px] text-faint tabular-nums select-none">
                    {index + 1}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-all pl-3 text-ink-2">
                  {line || " "}
                </span>
              </div>
            ))}
          </pre>
        </div>

        <div className="flex items-center gap-4 py-2 text-[10.5px] text-faint">
          <span className="tabular-nums">
            {lines.length.toLocaleString()} lines
          </span>
          <span aria-hidden className="h-3 w-px bg-line" />
          <span className="tabular-nums">
            {rawContent.length.toLocaleString()} chars
          </span>
          <span className="ml-auto font-mono uppercase">
            {log.raw ? "Raw text" : "JSON"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default LogRawView;
