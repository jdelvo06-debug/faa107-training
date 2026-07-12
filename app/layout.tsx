import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  metadataBase: new URL("https://faa107training.org"),
  title: "FAA Part 107 Training Platform",
  description: "Mobile-friendly remote pilot certification study platform with slides, quizzes, flashcards, and exam mode.",
  openGraph: {
    type: "website",
    url: "https://faa107training.org",
    siteName: "FAA Part 107 Training Platform",
    title: "FAA Part 107 Training Platform",
    description: "Mobile-friendly remote pilot certification study platform with slides, quizzes, flashcards, and exam mode.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAA Part 107 Training Platform",
    description: "Mobile-friendly remote pilot certification study platform with slides, quizzes, flashcards, and exam mode.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#b83a1a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
