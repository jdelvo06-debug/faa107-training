"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { addActivity, saveQuizAttempt } from "@/lib/progress-storage";
import type { QuizQuestion } from "@/lib/types";
import { cn, topicScores } from "@/lib/utils";

export function QuizEngine({ moduleId, moduleTitle, questions }: { moduleId: string; moduleTitle: string; questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const complete = Object.keys(answers).length === questions.length;
  const score = useMemo(
    () => questions.filter((item) => answers[item.id] === item.correctIndex).length,
    [answers, questions]
  );

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz coming soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">This module shell is ready. Questions will be added as the curriculum expands.</p>
          <Button asChild>
            <Link href="/modules">Back to modules</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[index];
  const answered = answers[question.id] !== undefined;

  function finishQuiz() {
    saveQuizAttempt({
      moduleId,
      score,
      total: questions.length,
      topicScores: topicScores(questions, answers)
    });
    addActivity({
      label: `Completed ${moduleTitle} quiz: ${score}/${questions.length}`,
      href: `/modules/${moduleId}/quiz`
    });
    setSaved(true);
  }

  function reset() {
    setAnswers({});
    setIndex(0);
    setSaved(false);
  }

  if (complete && saved) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
        <CardHeader>
          <CardTitle className="text-3xl text-white">{moduleTitle} Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div>
            <p className="text-5xl font-bold text-primary">{percent}%</p>
            <p className="mt-2 text-slate-300">
              You answered {score} of {questions.length} correctly.
            </p>
          </div>
          <Progress value={percent} />
          <div className="flex flex-wrap gap-3">
            <Button onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
            <Button asChild variant="outline">
              <Link href={`/modules/${moduleId}`}>Review slides</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <Progress value={Math.round(((index + 1) / questions.length) * 100)} className="bg-white/10" />
        <CardTitle className="pt-4 text-2xl leading-tight text-white">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {question.choices.map((choice, choiceIndex) => {
          const selected = answers[question.id] === choiceIndex;
          const correct = choiceIndex === question.correctIndex;
          return (
            <button
              key={choice}
              onClick={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))}
              className={cn(
                "flex min-h-14 items-center justify-between gap-3 rounded-lg border p-4 text-left text-sm transition-colors",
                selected && correct && "border-emerald-300 bg-emerald-300/15 text-emerald-50",
                selected && !correct && "border-red-300 bg-red-300/15 text-red-50",
                !selected && "border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.07]"
              )}
            >
              <span>{choice}</span>
              {selected && correct ? <CheckCircle2 className="h-5 w-5" /> : null}
              {selected && !correct ? <XCircle className="h-5 w-5" /> : null}
            </button>
          );
        })}

        {answered ? (
          <div className="rounded-lg border border-sky-300/25 bg-sky-300/10 p-4 text-sm leading-6 text-sky-50">
            {question.explanation}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>
            Previous
          </Button>
          {index < questions.length - 1 ? (
            <Button disabled={!answered} onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={!complete} onClick={finishQuiz}>
              Finish quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
