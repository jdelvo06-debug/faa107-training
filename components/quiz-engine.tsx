"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { applyQuizAnswer, getQuizModePolicy } from "@/lib/assessment-engine";
import { addActivity, saveQuizAttempt } from "@/lib/progress-storage";
import type { QuizMode, QuizQuestion } from "@/lib/types";
import { cn, topicScores } from "@/lib/utils";
import styles from "./modern-flight-school.module.css";

export function QuizEngine({
  moduleId,
  moduleTitle,
  questions,
}: {
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
}) {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const complete = Object.keys(answers).length === questions.length;
  const score = useMemo(
    () => questions.filter((item) => answers[item.id] === item.correctIndex).length,
    [answers, questions],
  );

  if (questions.length === 0) {
    return (
      <Card className={styles.coursePage}>
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

  function reset(nextMode: QuizMode | null = mode) {
    setAnswers({});
    setIndex(0);
    setSaved(false);
    setMode(nextMode);
  }

  if (!mode) {
    return (
      <Card className={`${styles.coursePage} border-white/10 bg-aviation-panel shadow-cockpit`}>
        <CardHeader>
          <Badge variant="sky" className="w-fit">Choose your quiz mode</Badge>
          <CardTitle className="text-3xl text-white">How do you want to use this quiz?</CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Learn with feedback as you go, or take a scored first-attempt check.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-sky-300/25 bg-sky-300/[0.06] p-5">
            <GraduationCap className="h-7 w-7 text-sky-300" />
            <h2 className="mt-4 text-xl font-bold text-white">Study Mode</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Learning mode. See correctness and explanations immediately, and change answers as you work.
            </p>
            <Button className="mt-5 w-full sm:w-auto" onClick={() => reset("study")}>
              Start Study Mode
            </Button>
          </div>
          <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-5">
            <ClipboardCheck className="h-7 w-7 text-amber-300" />
            <h2 className="mt-4 text-xl font-bold text-white">Assessment Mode</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Scored first-attempt mode. Each first answer locks; feedback and explanations appear after completion.
            </p>
            <Button className="mt-5 w-full sm:w-auto" variant="secondary" onClick={() => reset("assessment")}>
              Start Assessment Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const policy = getQuizModePolicy(mode);
  const question = questions[index];
  const answered = answers[question.id] !== undefined;

  function selectAnswer(choiceIndex: number) {
    setAnswers((current) => ({
      ...current,
      [question.id]: applyQuizAnswer(mode!, current[question.id], choiceIndex),
    }));
  }

  function finishQuiz() {
    saveQuizAttempt({
      moduleId,
      score,
      total: questions.length,
      topicScores: topicScores(questions, answers),
      mode: mode!,
    });
    addActivity({
      label: `Completed ${moduleTitle} ${mode === "study" ? "study" : "assessment"} quiz: ${score}/${questions.length}`,
      href: `/modules/${moduleId}/quiz`,
    });
    setSaved(true);
  }

  if (complete && saved) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className={`${styles.coursePage} grid gap-5`}>
        <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
          <CardHeader>
            <Badge variant={mode === "study" ? "sky" : "amber"} className="w-fit">
              {mode === "study" ? "Study Mode complete" : "Assessment Mode complete"}
            </Badge>
            <CardTitle className="text-3xl text-white">{moduleTitle} Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div role="status" aria-live="polite">
              <p className="text-5xl font-bold text-primary">{percent}%</p>
              <p className="mt-2 text-slate-300">You answered {score} of {questions.length} correctly.</p>
            </div>
            <Progress value={percent} aria-label="Quiz score" />
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => reset(mode)}>
                <RotateCcw className="h-4 w-4" />
                Retake this mode
              </Button>
              <Button variant="outline" onClick={() => reset(null)}>Choose another mode</Button>
              <Button asChild variant="outline">
                <Link href={`/modules/${moduleId}`}>Review slides</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <section aria-labelledby="quiz-review-heading" className="grid gap-3">
          <h2 id="quiz-review-heading" className="text-2xl font-bold text-white">Answer review</h2>
          {questions.map((item, questionIndex) => {
            const correct = answers[item.id] === item.correctIndex;
            return (
              <Card key={item.id} className="border-white/10 bg-white/[0.03]">
                <CardContent className="grid gap-2 p-5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={correct ? "sky" : "amber"}>Question {questionIndex + 1}</Badge>
                    <span className={correct ? "text-emerald-300" : "text-red-300"}>{correct ? "Correct" : "Incorrect"}</span>
                  </div>
                  <p className="font-semibold text-white">{item.prompt}</p>
                  <p className="text-slate-300">Your answer: {item.choices[answers[item.id]]}</p>
                  {!correct ? <p className="text-slate-300">Correct answer: {item.choices[item.correctIndex]}</p> : null}
                  <p className="leading-6 text-sky-100">{item.explanation}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    );
  }

  return (
    <Card className={`${styles.coursePage} border-white/10 bg-aviation-panel shadow-cockpit`}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant={mode === "study" ? "sky" : "amber"}>
            {mode === "study" ? "Study Mode · answers may change" : "Assessment Mode · first answer locks"}
          </Badge>
          <span className="text-sm text-slate-300">{Object.keys(answers).length} of {questions.length} answered</span>
        </div>
        <Progress
          value={Math.round(((index + 1) / questions.length) * 100)}
          className="bg-white/10"
          aria-label={`Question ${index + 1} of ${questions.length}`}
        />
        <CardTitle id={`question-prompt-${question.id}`} className="pt-4 text-2xl leading-tight text-white">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <fieldset aria-labelledby={`question-prompt-${question.id}`} className="m-0 min-w-0 border-0 p-0 grid gap-3">
          <legend className="sr-only">Answer choices</legend>
          <div role="radiogroup" aria-labelledby={`question-prompt-${question.id}`} className="grid gap-3">
            {question.choices.map((choice, choiceIndex) => {
              const selected = answers[question.id] === choiceIndex;
              const correct = choiceIndex === question.correctIndex;
              const reveal = policy.feedback === "immediate" && answered;
              return (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!policy.answersMayChange && answered}
                  onClick={() => selectAnswer(choiceIndex)}
                  className={cn(
                    "flex min-h-14 items-center justify-between gap-3 rounded-lg border p-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-80",
                    selected && !reveal && "border-primary bg-primary/15 text-white",
                    selected && reveal && correct && "border-emerald-300 bg-emerald-300/15 text-emerald-50",
                    selected && reveal && !correct && "border-red-300 bg-red-300/15 text-red-50",
                    !selected && "border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.07]",
                  )}
                >
                  <span>{choice}</span>
                  {selected && reveal && correct ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : null}
                  {selected && reveal && !correct ? <XCircle className="h-5 w-5" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div aria-live="polite">
          {policy.feedback === "immediate" && answered ? (
            <div className="rounded-lg border border-sky-300/25 bg-sky-300/10 p-4 text-sm leading-6 text-sky-50">
              <p className="font-semibold">{answers[question.id] === question.correctIndex ? "Correct." : "Not quite."}</p>
              <p>{question.explanation}</p>
            </div>
          ) : null}
          {mode === "assessment" && answered ? (
            <p className="text-sm text-slate-300">Answer locked. Correctness and explanation will appear after completion.</p>
          ) : null}
        </div>

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
            <Button disabled={!complete} onClick={finishQuiz}>Finish quiz</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
