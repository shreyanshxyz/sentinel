import { CopyCommand } from "@/components/marketing/CopyCommand";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Ingest",
    body: "Send structured events to the REST API. Zod validation rejects malformed payloads before they reach the database.",
  },
  {
    title: "Stream",
    body: "The API writes accepted events to PostgreSQL and pushes them to every open viewer over SSE.",
  },
  {
    title: "Analyze",
    body: "The Python worker polls pending events, runs statistical detectors, and streams an LLM analysis back to the viewer.",
  },
];

const STACK: { label: string; value: string }[] = [
  { label: "Viewer", value: "Next.js" },
  { label: "API", value: "Express · SSE · PostgreSQL" },
  { label: "Worker", value: "Python · detectors · Groq" },
];

const CURL = `curl -X POST "$SENTINEL_API/logs" \\
  -H "Content-Type: application/json" \\
  -d '{"level":"ERROR","source":"payment-service",
       "message":"Database connection failed"}'`;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div className="mx-auto max-w-[1180px] px-5 py-16 lg:py-24">
        <div className="max-w-[760px]">
          <p className="font-mono text-[9.5px] tracking-[.09em] text-faint uppercase">
            How it works
          </p>
          <h2 className="mt-3 text-[clamp(1.7rem,3.2vw,2.35rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance text-ink">
            Three steps, no agent to install.
          </h2>
          <p className="mt-3.5 text-[13.5px] leading-[1.65] text-muted">
            Send events over HTTP, watch them arrive over SSE, and let the
            worker explain the ones that fail.
          </p>
        </div>

        <ol className="mt-12 grid border-y border-line md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={
                index === 0
                  ? "py-8 md:pr-6"
                  : "border-t border-line py-8 md:border-t-0 md:border-l md:px-6"
              }
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-line font-mono text-[11px] text-ink-2">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div id="api" className="mt-12 max-w-[820px] scroll-mt-20">
          <p className="font-mono text-[9.5px] tracking-[.09em] text-faint uppercase">
            Send one event
          </p>
          <div className="mt-3 overflow-hidden rounded-[6px] border border-line bg-sunken">
            <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
              <span className="font-mono text-[10px] text-faint">
                send-event.sh
              </span>
              <CopyCommand text={CURL} />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-[1.7] text-ink-2">
              <code>{CURL}</code>
            </pre>
          </div>
          <p className="mt-3 text-[11.5px] text-muted">
            Then watch it arrive:{" "}
            <code className="font-mono text-[11px] text-ink-2">
              curl -N $SENTINEL_API/logs/live
            </code>
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[6px] border border-line bg-line md:grid-cols-3">
          {STACK.map((item) => (
            <div key={item.label} className="bg-canvas p-5">
              <p className="font-mono text-[9.5px] tracking-[.09em] text-faint uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-[12.5px] text-ink-2">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
