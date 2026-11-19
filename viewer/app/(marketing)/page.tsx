import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { ProofStrip } from "@/components/marketing/ProofStrip";
import { LiveTail } from "@/components/marketing/LiveTail";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { FinalCta } from "@/components/marketing/FinalCta";

export const metadata: Metadata = {
  title: "Sentinel — Log aggregation with AI analysis",
  description:
    "Sentinel streams events from every service in real time, flags the ones worth reading, and streams a root-cause analysis for the failures that matter.",
  openGraph: {
    title: "Sentinel — Log aggregation with AI analysis",
    description:
      "Sentinel streams events from every service in real time, flags the ones worth reading, and streams a root-cause analysis for the failures that matter.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProofStrip />
      <Features />
      <LiveTail />
      <HowItWorks />
      <FinalCta />
    </>
  );
}
