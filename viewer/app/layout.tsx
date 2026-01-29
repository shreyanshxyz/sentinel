import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sentinel",
  description: "Terminal-style log monitoring and analysis platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="bg-terminal-bg text-text-primary">
      <body
        className={`${firaCode.className} antialiased min-h-screen bg-terminal-bg`}
      >
        {children}
      </body>
    </html>
  );
}
