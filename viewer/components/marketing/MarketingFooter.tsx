export function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1120px] gap-8 px-5 py-12 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-ink">
            Sentinel
          </p>
          <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">
            Log aggregation with AI analysis.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 md:items-end">
          <div className="flex flex-wrap gap-5">
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
            <a
              href="#api"
              className="nav-link text-[12px] text-muted transition-colors duration-150 hover:text-ink"
            >
              API
            </a>
            <a
              href="https://github.com/shreyanshxyz/sentinel"
              target="_blank"
              rel="noreferrer"
              className="nav-link text-[12px] text-muted transition-colors duration-150 hover:text-ink"
            >
              GitHub
            </a>
          </div>
          <p className="font-mono text-[10.5px] text-faint">
            Built with Next.js · Express · Python
          </p>
        </div>
      </div>
    </footer>
  );
}

export default MarketingFooter;
