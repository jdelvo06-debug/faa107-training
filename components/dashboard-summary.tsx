"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/progress-ring";
import { modules } from "@/lib/course-data";
import { getContinueTarget, getFlashcardTotals, getOverallProgress, getWeakAreas } from "@/lib/progress-selectors";
import { resetProgress, useProgress } from "@/lib/progress-storage";

export function DashboardSummary() {
  const progress = useProgress();
  const overall = getOverallProgress(progress);
  const target = getContinueTarget(progress);
  const weakAreas = getWeakAreas(progress);
  const flashcardTotals = getFlashcardTotals(progress);
  const completedModules = modules.filter((courseModule) => progress.modules[courseModule.id]?.completed).length;
  const latestExam = progress.examAttempts[0];

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
            <ProgressRing value={overall} label="Overall progress" />
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back</h1>
              <p className="mt-2 max-w-2xl text-slate-300">
                Your browser stores course progress locally. Continue from the latest module, quiz, or exam activity.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={target.href}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" onClick={resetProgress}>
                  <RotateCcw className="h-4 w-4" />
                  Reset progress
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Modules completed</span>
                <span>{completedModules}/13</span>
              </div>
              <Progress value={Math.round((completedModules / modules.length) * 100)} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Flashcards reviewed</span>
                <span>{flashcardTotals.reviewed}/{flashcardTotals.total}</span>
              </div>
              <Progress value={Math.round((flashcardTotals.reviewed / flashcardTotals.total) * 100)} />
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-sm text-muted-foreground">Latest exam</p>
              <p className="mt-1 text-2xl font-bold">{latestExam ? `${latestExam.score}/${latestExam.total}` : "Not taken"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Continue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{target.label}</p>
            <Button asChild variant="outline">
              <Link href={target.href}>Open</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Weak areas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {weakAreas.length ? (
              weakAreas.map((area) => (
                <div key={area.topic}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{area.topic}</span>
                    <span>{area.percent}%</span>
                  </div>
                  <Progress value={area.percent} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Complete a quiz or exam to generate weak-area guidance.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {progress.recentActivity.length ? (
              progress.recentActivity.slice(0, 4).map((activity) => (
                <Link key={activity.id} href={activity.href} className="rounded-md border border-border p-3 text-sm hover:bg-accent">
                  {activity.label}
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Open a module, quiz, or flashcard deck to start tracking.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
