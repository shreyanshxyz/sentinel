"use client";

import { useRef } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function TopBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    router.push(
      value ? `/dashboard/search?q=${encodeURIComponent(value)}` : "/dashboard/search",
    );
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
        <ThemeToggle />
      </div>
    </header>
  );
}

export default TopBar;
