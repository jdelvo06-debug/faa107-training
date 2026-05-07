"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/lib/progress-storage";

export default function ExamResultsPage() {
  const progress = useProgress();
  const attempt = progress.examAttempts[0];

  if (!attempt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No exam result yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Take the practice exam to see score, pass/fail, and topic breakdown here.</p>
          <Button asChild>
            <Link href="/exam">Start exam</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const percent = Math.round((attempt.score / attempt.total) * 100);
  const StatusIcon = attempt.passed ? CheckCircle2 : XCircle;

  return (
    <div className="grid gap-5">
      <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-4xl text-white">
            <StatusIcon className={attempt.passed ? "h-9 w-9 text-emerald-300" : "h-9 w-9 text-red-300"} />
            {attempt.passed ? "Passing score" : "Keep studying"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div>
            <p className="text-6xl font-black text-primary">{percent}%</p>
            <p className="mt-2 text-slate-300">
              {attempt.score} of {attempt.total} correct. {attempt.flaggedCount} question(s) were flagged.
            </p>
          </div>
          <Progress value={percent} />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/exam">Retake exam</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Topic breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {Object.entries(attempt.topicScores).map(([topic, score]) => {
            const topicPercent = Math.round((score.correct / score.total) * 100);
            return (
              <div key={topic}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{topic}</span>
                  <span>
                    {score.correct}/{score.total}
                  </span>
                </div>
                <Progress value={topicPercent} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
