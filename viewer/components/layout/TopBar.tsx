"use client";

import { useRef, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setTheme, subscribeTheme, themeSnapshot } from "@/lib/theme";
import { MoonIcon, SearchIcon, SunIcon } from "@/components/ui/icons";

export function TopBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    () => "light" as const,
  );

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <header className="flex items-center h-12 shrink-0 items-center gap-2 border-b border-line bg-canvas px-5">
      <Link href="/" className="text-[15.5px] mt-0.5 font-semibold  text-ink">
        Sentinel
      </Link>

      <form
        onSubmit={handleSubmit}
        role="search"
        className="hidden min-[900px]:flex"
      >
        <label htmlFor="global-search" className="sr-only">
          Search logs
        </label>
        <div className="relative flex items-center">
          <SearchIcon className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-faint" />
          <input
            id="global-search"
            ref={inputRef}
            type="search"
            placeholder="Search logs, IDs…"
            className="h-[27px] w-[280px] rounded-[5px] border border-line bg-sunken pr-2 pl-7 text-[11.5px] text-ink transition-colors duration-150 placeholder:text-faint hover:border-line-strong focus:border-ink focus:outline-none"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
          className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] border border-transparent text-muted transition-colors duration-150 hover:bg-hover hover:text-ink"
        >
          {resolvedTheme === "dark" ? (
            <SunIcon className="h-4 w-4" />
          ) : (
            <MoonIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}

export default TopBar;
