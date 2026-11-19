import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[4px] focus:border focus:border-line-strong focus:bg-surface focus:px-3 focus:py-1.5 focus:text-[12px] focus:text-ink"
      >
        Skip to content
      </a>
      <MarketingHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <MarketingFooter />
    </>
  );
}
