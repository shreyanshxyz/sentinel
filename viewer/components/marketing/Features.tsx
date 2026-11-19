import {
  FeatureRow,
  type FeatureRowProps,
} from "@/components/marketing/FeatureRow";

const ROWS: FeatureRowProps[] = [
  {
    index: "01",
    eyebrow: "Live feed",
    title: "Read the stream, not everything in it.",
    body: "Filter by level, source, and time window. Severity is the only colour on the screen, and every row opens the full event.",
    bullets: [
      "Pause and resume without losing the buffer.",
      "Severity colour reserved for DEBUG through FATAL.",
      "Every row opens the event, its metadata, and its analysis.",
    ],
    image: {
      src: "/product/live-feed.png",
      alt: "Live feed table showing INFO, WARN, and ERROR rows from eight services above a volume histogram",
      width: 2880,
      height: 1800,
    },
  },
  {
    index: "02",
    eyebrow: "Analysis",
    title: "An analysis, not another chart.",
    body: "The worker runs statistical checks first — error-rate spikes, frequency anomalies, source dominance — then asks a model to explain the events that matter, with related logs in context.",
    bullets: [
      "Confidence, model, and generation time are recorded.",
      "Known failure patterns are matched before the LLM sees the event.",
      "Follow-ups are ranked, not listed.",
    ],
    image: {
      src: "/product/analysis.png",
      alt: "Event detail with the AI analysis panel showing summary, root cause, confidence, and follow-up actions",
      width: 2880,
      height: 1800,
    },
    reverse: true,
  },
  {
    index: "03",
    eyebrow: "Search",
    wide: true,
    title: "Find it again in seconds.",
    body: "Full-text search with level, source, and time facets. Results open the same event view as the feed.",
    bullets: [
      "Facets, not query syntax.",
      "Results link straight to the event.",
      "Live-feed filters are remembered between sessions.",
    ],
    image: {
      src: "/product/search.png",
      alt: "Search results for a full-text query with level, source, and time filters applied",
      width: 2880,
      height: 1800,
    },
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-[1180px] px-5 [&>article:first-child]:border-t-0">
        {ROWS.map((row) => (
          <FeatureRow key={row.title} {...row} />
        ))}
      </div>
    </section>
  );
}

export default Features;
