"use client";

import Link from "next/link";
import { BookOpenCheck, CheckCircle2, Flag, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getExamResultMessaging } from "@/lib/exam-session";
import { useProgress } from "@/lib/progress-storage";
import styles from "@/components/modern-flight-school.module.css";

export default function ExamResultsPage() {
  const progress = useProgress();
  const attempt = progress.examAttempts[0];

  if (!attempt) {
    return (
      <Card className={`${styles.resultsMain} ${styles.resultsEmpty}`}>
        <CardHeader>
          <h1>No exam result yet</h1>
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
  const messaging = getExamResultMessaging(attempt.variant, attempt.passed);
  const StatusIcon = messaging.assessment
    ? attempt.passed ? CheckCircle2 : XCircle
    : BookOpenCheck;
  const statusIconClass = !messaging.assessment
    ? "h-9 w-9 text-sky-300"
    : attempt.passed ? "h-9 w-9 text-emerald-300" : "h-9 w-9 text-red-300";

  return (
    <div className={styles.resultsMain}>
      <Card className={styles.resultsHero}>
        <CardHeader>
          <Badge variant={attempt.variant === "practice_drill" ? "sky" : "amber"} className="w-fit">{messaging.label}</Badge>
          <h1 className={styles.resultsTitle}>
            <StatusIcon className={statusIconClass} />
            {messaging.title}
          </h1>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div>
            <p className="text-6xl font-black text-primary">{percent}%</p>
            <p className="mt-2 text-slate-300">
              {attempt.score} of {attempt.total} correct. {attempt.flaggedCount} question(s) were flagged.
            </p>
          </div>
          <Progress value={percent} aria-label="Exam score progress" />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/exam">{messaging.action}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className={styles.resultsPanel}>
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
                <Progress value={topicPercent} aria-label={`Topic score progress for ${topic}`} />
              </div>
            );
          })}
        </CardContent>
      </Card>
      <section aria-labelledby="answer-review-heading" className={styles.resultsReview}>
        <h2 id="answer-review-heading">Detailed answer review</h2>
        {attempt.review && attempt.review.length > 0 ? (
          attempt.review.map((item) => (
            <Card key={`${attempt.id}-${item.questionNumber}`} className={styles.resultsAnswer}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.correct ? "sky" : "amber"}>Question {item.questionNumber}</Badge>
                    <Badge variant="outline">{item.topic}</Badge>
                    {item.flagged ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                        <Flag className="h-3.5 w-3.5" aria-hidden="true" /> Flagged
                      </span>
                    ) : null}
                  </div>
                  <span className={item.correct ? "font-semibold text-emerald-300" : "font-semibold text-red-300"}>
                    {item.correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <CardTitle className="pt-2 text-lg leading-7">{item.prompt}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm leading-6">
                <p className="text-slate-300">
                  <span className="font-semibold text-white">Your answer:</span> {item.selectedAnswer ?? "Unanswered"}
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold text-white">Correct answer:</span> {item.correctAnswer}
                </p>
                <div className="mt-1 rounded-lg border border-sky-300/20 bg-sky-300/[0.07] p-4 text-sky-50">
                  {item.explanation}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className={styles.resultsAnswer}>
            <CardContent className="p-5 text-sm leading-6 text-slate-300">
              Detailed answer review is unavailable for this earlier attempt. Its saved score and topic breakdown remain available above.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
