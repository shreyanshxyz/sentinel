"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import { cn } from "@/lib/utils";
import {
  BarsIcon,
  SlidersIcon,
  PulseIcon,
  SearchIcon,
} from "@/components/ui/icons";

export type HealthStatus =
  | "operational"
  | "degraded"
  | "unreachable"
  | "checking";

interface NavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => JSX.Element;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Monitor",
    items: [{ label: "Live feed", href: "/", icon: PulseIcon }],
  },
  {
    label: "Analyze",
    items: [
      { label: "Search", href: "/search", icon: SearchIcon },
      { label: "Analytics", href: "/analytics", icon: BarsIcon },
    ],
  },
  {
    label: "Manage",
    items: [{ label: "Settings", href: "/settings", icon: SlidersIcon }],
  },
];

const HEALTH: Record<
  HealthStatus,
  { dot: string; label: string }
> = {
  operational: { dot: "bg-ok", label: "Operational" },
  degraded: { dot: "bg-warn", label: "Degraded" },
  unreachable: { dot: "bg-error", label: "Unreachable" },
  checking: { dot: "bg-line-strong", label: "Checking" },
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface NavRailProps {
  healthStatus: HealthStatus;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function NavRail({
  healthStatus,
  orientation = "vertical",
  className,
}: NavRailProps) {
  const pathname = usePathname();
  const health = HEALTH[healthStatus];

  if (orientation === "horizontal") {
    return (
      <nav
        aria-label="Primary"
        className={cn(
          "flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-2.5 py-1.5 lg:hidden",
          className,
        )}
      >
        {NAV_GROUPS.flatMap((group) => group.items).map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-7 shrink-0 items-center gap-2 rounded-[5px] px-2.5 text-[12.5px] leading-none whitespace-nowrap transition-colors duration-150",
                active
                  ? "bg-selected font-[550] text-ink"
                  : "text-muted hover:bg-hover hover:text-ink",
              )}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 pr-2.5 pl-2 text-[10.5px] text-muted">
          <span className={cn("h-1.5 w-1.5 rounded-full", health.dot)} />
          {health.label}
        </span>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "hidden w-52 shrink-0 flex-col border-r border-line bg-canvas px-2.5 pt-[18px] pb-2 lg:flex",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex h-6 items-center px-2.5 text-[9.5px] font-semibold tracking-[.09em] text-faint uppercase">
              {group.label}
            </div>
            <div className="flex flex-col gap-px">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-[30px] items-center gap-2 rounded-[5px] px-2.5 text-[12.5px] leading-none transition-colors duration-150",
                      active
                        ? "bg-selected font-[550] text-ink"
                        : "text-muted hover:bg-hover hover:text-ink",
                    )}
                  >
                    <Icon className="h-[15px] w-[15px] shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto -mx-2.5 border-t border-line px-5 pt-2 pb-0.5">
        <div className="flex h-[30px] items-center gap-2 text-[11.5px] text-muted">
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", health.dot)}
          />
          {health.label}
        </div>
      </div>
    </nav>
  );
}

export default NavRail;
