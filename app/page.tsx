import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Radar, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  "All 13 modules fully built",
  "Complete Part 107 curriculum",
  "Local progress tracking",
  "Timed practice exam",
  "Flashcards and knowledge checks",
  "Mobile-ready classroom view"
];

export default function LandingPage() {
  return (
    <div className="grid gap-10">
      <section className="runway-grid animate-drift relative overflow-hidden rounded-lg border border-white/10 bg-aviation-panel shadow-cockpit">
        <div className="hero-glow" />
        <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="flex min-h-[520px] flex-col justify-center">
            <Badge variant="amber" className="fade-up fade-up-delay-1 mb-5 w-fit">FAA Part 107</Badge>
            <h1 className="fade-up fade-up-delay-2 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Remote pilot certification training, built like a flight deck.
            </h1>
            <p className="fade-up fade-up-delay-3 mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Study the Part 107 path with slide lessons, check-on-learning quizzes, flashcards, and a timed practice
              exam that tracks weak areas in your browser.
            </p>
            <div className="fade-up fade-up-delay-4 mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/modules/1">
                  Start Module 1
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          </div>
          <div className="grid content-center gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Certification route</p>
                  <p className="text-2xl font-bold text-white">FTN to certificate</p>
                </div>
                <Radar className="h-9 w-9 text-primary" />
              </div>
              <div className="grid gap-3">
                {["IACRA profile", "UAG knowledge test", "Form 8710-13", "Temporary certificate"].map((item, index) => (
                  <div key={item} className="grid grid-cols-[2rem_1fr] items-center gap-3 rounded-md bg-black/20 p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-100">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/[0.06]">
                <CardContent className="p-5">
                  <Clock className="mb-4 h-7 w-7 text-primary" />
                  <p className="text-3xl font-bold">120</p>
                  <p className="text-sm text-muted-foreground">minutes on the real exam</p>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.06]">
                <CardContent className="p-5">
                  <ShieldCheck className="mb-4 h-7 w-7 text-primary" />
                  <p className="text-3xl font-bold">70%</p>
                  <p className="text-sm text-muted-foreground">minimum passing score</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <BookOpen className="mb-4 h-8 w-8 text-primary" />
            <h2 className="text-xl font-bold">Structured lessons</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Modules follow the FAA knowledge areas from orientation through industry pathways — all 13 fully built.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <CheckCircle2 className="mb-4 h-8 w-8 text-primary" />
            <h2 className="text-xl font-bold">Built for recall</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Immediate quiz explanations and flashcard decisions turn rule numbers into retained knowledge.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Radar className="mb-4 h-8 w-8 text-primary" />
            <h2 className="text-xl font-bold">Progress cockpit</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Dashboard cards summarize course progress, weak areas, recent activity, and exam history.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h2 className="mb-4 text-2xl font-bold">What&apos;s included</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
