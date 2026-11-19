"use client";

import React from "react";
import { useHealth } from "@/hooks/useQueries";
import { NavRail, type HealthStatus } from "./NavRail";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data, isError, isPending } = useHealth({ refetchInterval: 60000 });

  const healthStatus: HealthStatus = isPending
    ? "checking"
    : isError || !data || data.status === "unhealthy"
      ? "unreachable"
      : data.status === "degraded"
        ? "degraded"
        : "operational";

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <NavRail healthStatus={healthStatus} />
        <NavRail healthStatus={healthStatus} orientation="horizontal" />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
