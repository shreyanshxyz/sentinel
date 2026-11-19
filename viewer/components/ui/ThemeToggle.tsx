"use client";

import { useSyncExternalStore } from "react";
import { setTheme, subscribeTheme, themeSnapshot } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

export interface ThemeToggleProps {
  className?: string | undefined;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    () => "light" as const,
  );

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
      className={cn(
        "flex h-[27px] w-[27px] items-center justify-center rounded-[5px] border border-transparent text-muted transition-colors duration-150 hover:bg-hover hover:text-ink",
        className,
      )}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </button>
  );
}
