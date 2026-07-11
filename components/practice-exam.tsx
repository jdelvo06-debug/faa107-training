"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Timer, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  completeExamAttempt,
  getActiveExamSession,
  saveActiveExamSession
} from "@/lib/progress-storage";
import {
  createActiveExamSession,
  createExamCompletionOutcome,
  createExamSubmissionController,
  type ExamCompletionFallback
} from "@/lib/exam-session";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEMO_SECONDS = 120 * 60;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function PracticeExam({ questions }: { questions: QuizQuestion[] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pool, setPool] = useState<QuizQuestion[]>([]);
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEMO_SECONDS);
  const [deadlineAt, setDeadlineAt] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [persistenceWarning, setPersistenceWarning] = useState(false);
  const [completionFallback, setCompletionFallback] = useState<ExamCompletionFallback | null>(null);
  const submissionController = useMemo(() => createExamSubmissionController(), []);
  const question = pool[index];
  const answeredCount = Object.keys(answers).length;

  submissionController.update({ pool, answers, flags });

  useEffect(() => {
    const restored = getActiveExamSession(questions);
    if (restored) {
      setPool(restored.pool);
      setAnswers(restored.answers);
      setFlags(restored.flags);
      setIndex(restored.currentIndex);
      setSecondsLeft(restored.secondsLeft);
      setDeadlineAt(restored.deadlineAt);
      setStarted(true);
    }
    setReady(true);
  }, [questions]);

  useEffect(() => {
    if (!ready || !started || pool.length === 0 || deadlineAt <= Date.now()) {
      return;
    }

    const saved = saveActiveExamSession(
      createActiveExamSession(
        {
          questionIds: pool.map((item) => item.id),
          answers,
          flags,
          currentIndex: index,
          remainingSeconds: Math.ceil((deadlineAt - Date.now()) / 1_000),
          deadlineAt
        },
        Date.now()
      )
    );
    setPersistenceWarning(!saved);
  }, [answers, deadlineAt, flags, index, pool, ready, started]);

  const submitExam = useCallback(() => {
    const attempt = submissionController.submit();
    if (!attempt) {
      return;
    }

    const completion = completeExamAttempt(attempt);
    const outcome = createExamCompletionOutcome(attempt, completion.persisted);
    if (outcome.route) {
      router.push(outcome.route);
      return;
    }

    setCompletionFallback(outcome.fallback);
    setStarted(false);
  }, [router, submissionController]);

  useEffect(() => {
    if (!started || deadlineAt === 0) {
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1_000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        submitExam();
      }
    };

    tick();
    const id = window.setInterval(() => {
      tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadlineAt, started, submitExam]);

  function startExam() {
    const nextPool = shuffled(questions).slice(0, 60);
    const nextDeadline = Date.now() + DEMO_SECONDS * 1_000;
    setPool(nextPool);
    setAnswers({});
    setFlags([]);
    setIndex(0);
    setSecondsLeft(DEMO_SECONDS);
    setDeadlineAt(nextDeadline);
    setStarted(true);
    const saved = saveActiveExamSession(
      createActiveExamSession({
        questionIds: nextPool.map((item) => item.id),
        answers: {},
        flags: [],
        currentIndex: 0,
        remainingSeconds: DEMO_SECONDS,
        deadlineAt: nextDeadline
      })
    );
    setPersistenceWarning(!saved);
  }

  function selectAnswer(questionId: string, choiceIndex: number) {
    setAnswers((current) => {
      const next = { ...current, [questionId]: choiceIndex };
      submissionController.update({ pool, answers: next, flags });
      return next;
    });
  }

  function toggleFlag(questionId: string) {
    setFlags((current) => {
      const next = current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId];
      submissionController.update({ pool, answers, flags: next });
      return next;
    });
  }

  if (!ready) {
    return (
      <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
        <CardContent className="p-6 text-slate-300">Loading practice exam…</CardContent>
      </Card>
    );
  }

  if (completionFallback) {
    return (
      <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
        <CardHeader>
          <Badge variant={completionFallback.passed ? "sky" : "amber"} className="w-fit">
            {completionFallback.passed ? "Passed" : "Not passed"}
          </Badge>
          <CardTitle className="text-3xl text-white">Practice exam complete</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-2xl font-bold text-white">
            Score: {completionFallback.score}/{completionFallback.total}
          </p>
          <p role="alert" className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            This result could not be saved and will disappear if you refresh this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
        <CardHeader>
          <Badge variant="amber" className="w-fit">Timed mode</Badge>
          <CardTitle className="max-w-3xl text-4xl text-white">Practice Exam</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="max-w-2xl text-slate-300">
            60 questions drawn from a pool of {questions.length} Part 107-style questions. 120-minute timer, answer review flags, topic breakdown scoring — same format as the real FAA exam.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">60</p>
              <p className="text-sm text-slate-400">Questions</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">120 min</p>
              <p className="text-sm text-slate-400">Timer</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">70%</p>
              <p className="text-sm text-slate-400">Pass mark</p>
            </div>
          </div>
          <Button className="w-fit" size="lg" onClick={startExam}>
            <Trophy className="h-5 w-5" />
            Start exam
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
      <Card className="border-white/10 bg-aviation-panel shadow-cockpit">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="sky">{question.topic}</Badge>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Timer className="h-4 w-4 text-primary" />
              {formatTime(secondsLeft)}
            </div>
          </div>
          <Progress value={Math.round((answeredCount / pool.length) * 100)} className="bg-white/10" />
          {persistenceWarning ? (
            <p role="status" className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
              Exam progress will not survive a refresh in this browser.
            </p>
          ) : null}
          <CardTitle className="pt-4 text-2xl leading-tight text-white">
            Question {index + 1}. {question.prompt}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {question.choices.map((choice, choiceIndex) => {
            const selected = answers[question.id] === choiceIndex;
            return (
              <button
                key={choice}
                onClick={() => selectAnswer(question.id, choiceIndex)}
                className={cn(
                  "rounded-lg border p-4 text-left text-sm transition-colors",
                  selected ? "border-primary bg-primary/15 text-white" : "border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.07]"
                )}
              >
                {choice}
              </button>
            );
          })}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant={flags.includes(question.id) ? "secondary" : "outline"}
              onClick={() => toggleFlag(question.id)}
            >
              <Flag className="h-4 w-4" />
              {flags.includes(question.id) ? "Flagged" : "Flag for review"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>
                Previous
              </Button>
              <Button disabled={index === pool.length - 1} onClick={() => setIndex((current) => Math.min(pool.length - 1, current + 1))}>
                Next
              </Button>
              <Button onClick={submitExam}>Submit</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="h-fit border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Review grid</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-5 gap-2">
          {pool.map((item, questionIndex) => (
            <button
              key={item.id}
              onClick={() => setIndex(questionIndex)}
              className={cn(
                "h-10 rounded-md border text-sm font-semibold",
                questionIndex === index && "border-primary bg-primary text-primary-foreground",
                questionIndex !== index && answers[item.id] !== undefined && "border-emerald-300/30 bg-emerald-300/15 text-emerald-50",
                questionIndex !== index && answers[item.id] === undefined && "border-white/10 text-slate-300",
                flags.includes(item.id) && "ring-2 ring-amber-300"
              )}
            >
              {questionIndex + 1}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
