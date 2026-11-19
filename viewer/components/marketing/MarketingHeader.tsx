import Link from "next/link";
import { buttonClass } from "@/components/ui/buttonStyles";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-canvas">
      <div className="mx-auto flex h-full max-w-[1120px] items-center gap-7 px-5">
        <Link
          href="/"
          className="nav-link text-[13.5px] font-semibold tracking-[-0.02em] text-ink"
        >
          Sentinel
        </Link>

        <nav
          aria-label="Marketing"
          className="hidden items-center gap-6 min-[820px]:flex"
        >
          <a
            href="#features"
            className="nav-link text-[12px] text-muted transition-colors duration-150 hover:text-ink"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="nav-link text-[12px] text-muted transition-colors duration-150 hover:text-ink"
          >
            How it works
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className={buttonClass("primary", "md", "btn-lift")}
          >
            Open live demo
          </Link>
        </div>
      </div>
    </header>
  );
}

export default MarketingHeader;
