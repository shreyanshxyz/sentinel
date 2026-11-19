import Link from "next/link";
import { buttonClass } from "@/components/ui/buttonStyles";

const TEXTURE = [
  "14:32:08.204 ERROR payment-service  connection timeout after 5000ms",
  "14:32:08.766 INFO  checkout-service  cart priced",
  "14:32:09.118 WARN  api-gateway  rate limit reached",
  "14:32:10.027 ERROR auth-service  token signature mismatch",
  "14:32:10.419 DEBUG api-gateway  route cache hit",
  "14:32:11.302 INFO  shipping-service  retrying batch",
  "14:32:11.744 FATAL worker-service  out of memory",
  "14:32:12.091 WARN  checkout-service  latency above threshold",
  "14:32:12.480 INFO  auth-service  session refreshed",
  "14:32:13.016 DEBUG worker-service  queue drained",
].join("\n");

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden select-none lg:block"
      >
        <pre className="translate-y-[-4%] font-mono text-[10.5px] leading-[2.1] text-canvas/[0.14] [mask-image:linear-gradient(to_left,black_55%,transparent_98%)]">
          {`${TEXTURE}\n${TEXTURE}`}
        </pre>
      </div>

      <div className="relative mx-auto max-w-[1180px] px-5 py-16 lg:py-24">
        <div className="max-w-[620px]">
          <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance text-canvas">
            Start with the live instance.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[13.5px] leading-[1.65] text-canvas/70">
            No signup. The demo streams seeded events into its own Postgres
            instance. The free-tier backend can take up to a minute to wake.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/dashboard"
              className={buttonClass(
                "secondary",
                "xl",
                "btn-lift btn-lift--xl",
              )}
            >
              Open the live demo
            </Link>
            <a
              href="#api"
              className="nav-link text-[13px] text-canvas/75 transition-colors duration-150 hover:text-canvas"
            >
              Read the API
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCta;
