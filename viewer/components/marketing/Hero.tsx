import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonClass } from "@/components/ui/buttonStyles";

const HEADLINE = "Find the log that explains what broke.";
const WORDS = HEADLINE.split(" ");

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1180px] px-5 pt-16 pb-12 lg:pt-24 lg:pb-16">
        <div className="max-w-[900px]">
          <p className="hero-fade font-mono text-[10.5px] tracking-[.14em] text-faint uppercase">
            Log aggregation · AI analysis
          </p>
          <h1 className="mt-6 text-[clamp(2.5rem,5.4vw,3.9rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance text-ink">
            {WORDS.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                <span
                  className="hero-word"
                  style={{ animationDelay: `${60 + index * 45}ms` }}
                >
                  {word}
                </span>
                {index < WORDS.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>
          <p
            className="hero-fade mt-7 max-w-[62ch] text-[16px] leading-[1.65] text-muted"
            style={{ animationDelay: "380ms" }}
          >
            Sentinel streams events from every service in real time, flags the
            ones worth reading, and streams a root-cause analysis for the
            failures that matter.
          </p>
          <div
            className="hero-fade mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"
            style={{ animationDelay: "440ms" }}
          >
            <Link
              href="/dashboard"
              className={buttonClass("primary", "xl", "btn-lift btn-lift--xl")}
            >
              Open the live demo
            </Link>
            <a
              href="#how-it-works"
              className="nav-link text-[13px] text-ink-2 transition-colors duration-150 hover:text-ink"
            >
              See how it works
            </a>
            <span className="text-[11px] text-faint">
              No account · Seeded events · Open API
            </span>
          </div>
        </div>
      </div>

      <figure>
        <div className="hero-media">
          <Image
            src="/product/live-feed.png"
            alt="Sentinel live feed: filter bar, volume histogram, and a table of incoming events with severity labels"
            width={2880}
            height={1800}
            priority
            unoptimized
            className="block h-auto w-full"
          />
        </div>
        <figcaption className="border-t border-line bg-sunken">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 px-5 py-3 font-mono text-[10.5px] text-faint">
            <span>Live feed · 8 sources · severity-coloured</span>
            <Link
              href="/dashboard"
              className="nav-link text-ink-2 transition-colors duration-150 hover:text-ink"
            >
              Open the demo →
            </Link>
          </div>
        </figcaption>
      </figure>
    </section>
  );
}

export default Hero;
