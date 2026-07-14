"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Gauge, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseModuleMetadata as modules } from "@/lib/course-metadata";
import { getModuleCompletion } from "@/lib/progress-selectors";
import { useProgress } from "@/lib/progress-storage";
import type { QuizAttempt } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ModuleCardGrid() {
  const progress = useProgress();
  const latestAttempts = useMemo(() => {
    const attemptsByModule = new Map<string, QuizAttempt>();
    for (const attempt of progress.quizAttempts) {
      const existing = attemptsByModule.get(attempt.moduleId);
      if (!existing || Date.parse(attempt.completedAt) > Date.parse(existing.completedAt)) {
        attemptsByModule.set(attempt.moduleId, attempt);
      }
    }
    return attemptsByModule;
  }, [progress.quizAttempts]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((courseModule) => {
        const moduleProgress = progress.modules[courseModule.id];
        const percent = getModuleCompletion(courseModule.id, progress);
        const completed = moduleProgress?.completed === true;
        const inProgress = !completed && percent > 0;
        const latestAttempt = latestAttempts.get(courseModule.id);
        const lessonAction = completed
          ? "Review module"
          : inProgress
            ? "Resume module"
            : "Open module";

        return (
          <Card
            key={courseModule.id}
            data-module-id={courseModule.id}
            className={cn(
              "flex min-w-0 flex-col transition-colors",
              completed && "border-teal-400/40 bg-teal-400/[0.04]",
            )}
          >
            <CardHeader>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge variant="amber">Module {courseModule.number}</Badge>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {courseModule.estimatedMinutes} min
                </span>
              </div>
              <CardTitle>{courseModule.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm leading-6 text-muted-foreground">{courseModule.description}</p>

              {completed ? (
                <Badge className="mt-4 w-fit border-teal-500/40 bg-teal-500/10 text-teal-800">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Complete
                </Badge>
              ) : inProgress ? (
                <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-teal-800">
                  <Gauge className="h-4 w-4" aria-hidden="true" />
                  {percent}% lesson progress
                </p>
              ) : null}

              {latestAttempt ? (
                <div className="mt-4 rounded-md border border-border/70 bg-background/30 px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">
                    Latest quiz: {latestAttempt.score}/{latestAttempt.total} ·{" "}
                    {latestAttempt.total > 0
                      ? Math.round((latestAttempt.score / latestAttempt.total) * 100)
                      : 0}%
                  </p>
                </div>
              ) : null}

              <div className={cn("mt-5 grid gap-2", latestAttempt && "sm:grid-cols-2")}>
                <Button asChild>
                  <Link href={`/modules/${courseModule.id}`}>
                    {lessonAction}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                {latestAttempt ? (
                  <Button asChild variant="outline">
                    <Link href={`/modules/${courseModule.id}/quiz`}>
                      Retake quiz
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
