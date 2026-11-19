"use client";

import { useEffect, useState } from "react";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface RelativeTimeProps {
  iso: string;
  className?: string;
}

export function RelativeTime({ iso, className }: RelativeTimeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span suppressHydrationWarning className={cn(className)}>
      {formatRelative(iso, new Date(now))}
    </span>
  );
}

export default RelativeTime;
