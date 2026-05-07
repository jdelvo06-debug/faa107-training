import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl font-bold tracking-normal">About this course</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          A neutral FAA Part 107 study platform designed for self-guided learners and classroom instructors.
        </p>
      </div>
      <Card className="border-white/10 bg-aviation-panel">
        <CardContent className="grid gap-5 p-6 text-slate-200">
          <p>
            A web-first training platform for remote pilot certification: slide lessons, knowledge checks,
            flashcards, progress tracking, and timed exam practice — all 13 modules, all mobile-responsive.
          </p>
          <p>
            Content is written from FAA source material and structured around the knowledge areas remote
            pilots need for safe, compliant Part 107 operations.
          </p>
          <p>
            Built with Next.js, TypeScript, and shadcn/ui. Self-contained — no backend, no signup, no paywall.
            Progress saves locally in your browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
