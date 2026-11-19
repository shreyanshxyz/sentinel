import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TagProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Tag({ children, className, title }: TagProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-full items-center rounded-[3px] border border-line px-1 font-mono text-[9px] leading-[15px] whitespace-nowrap text-muted",
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

export default Tag;
