import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppShell } from "@/components/layout/AppShell";
import { THEME_SCRIPT } from "@/lib/theme";
import { settingsBootstrap } from "@/lib/settings";
import { SettingsProvider } from "@/providers/SettingsProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentinel",
  description: "Log monitoring with AI-assisted analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: settingsBootstrap() }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-canvas font-sans text-ink antialiased`}
      >
        <QueryProvider>
          <SettingsProvider>
            <AppShell>{children}</AppShell>
          </SettingsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
