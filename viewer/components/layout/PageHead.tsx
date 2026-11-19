import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeadProps {
  title: string;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHead({
  title,
  subtitle,
  status,
  actions,
  className,
}: PageHeadProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-start justify-between gap-4 px-5 pt-[18px] pb-[14px]",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[20px] leading-[1.2] font-semibold tracking-[-0.025em] text-ink">
            {title}
          </h1>
          {status}
        </div>
        {subtitle ? (
          <div className="mt-1 text-[12px] leading-[1.4] text-muted">
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center justify-end gap-[7px]">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export default PageHead;
