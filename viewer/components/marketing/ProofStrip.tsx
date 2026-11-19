import { cn } from "@/lib/utils";

const FACTS: { label: string; value: string }[] = [
  { label: "Stream", value: "SSE, live delivery" },
  { label: "Analysis", value: "Groq-hosted model, streamed" },
  { label: "Storage", value: "PostgreSQL" },
  { label: "Interface", value: "REST ingestion + SSE" },
];

export function ProofStrip() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 md:grid-cols-4">
        {FACTS.map((fact, index) => (
          <div
            key={fact.label}
            className={cn(
              "px-5 py-7",
              index > 1 && "border-t border-line md:border-t-0",
              index % 2 === 1 && "border-l border-line",
              index === 2 && "md:border-l",
            )}
          >
            <p className="font-mono text-[9.5px] tracking-[.09em] text-faint uppercase">
              {fact.label}
            </p>
            <p className="mt-2 text-[14px] leading-[1.45] font-medium text-ink">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProofStrip;
