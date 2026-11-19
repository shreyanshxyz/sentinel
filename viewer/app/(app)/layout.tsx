import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Sentinel" };

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
