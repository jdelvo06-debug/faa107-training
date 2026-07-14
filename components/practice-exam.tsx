"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpenCheck,
  ClipboardList,
  Flag,
  Plane,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  applyQuizAnswer,
  buildFaaTimedExam,
  buildPracticeDrill,
  presentQuestion,
} from "@/lib/assessment-engine";
import {
  completeExamAttempt,
  getActiveExamSession,
  saveActiveExamSession,
} from "@/lib/progress-storage";
import {
  createActiveExamSession,
  createExamCompletionOutcome,
  createExamReviewSummary,
  createExamSubmissionController,
  getExamResultMessaging,
  getManualSubmitGuard,
  type ExamCompletionFallback,
} from "@/lib/exam-session";
import { GOVERNED_FACTS } from "@/lib/regulatory-sources";
import type {
  AssessmentVariant,
  ExamVariant,
  PresentationQuestion,
  QuizQuestion,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./modern-flight-school.module.css";

const FAA_EXAM_SECONDS =
  GOVERNED_FACTS.acsWeighting.testingTimeMinutes * 60;
const DRILL_QUESTION_COUNT = GOVERNED_FACTS.acsWeighting.totalQuestions;
const PRESENTED_CHOICE_COUNT = 3;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function createSeed() {
  return Date.now();
}

export function PracticeExam({ questions }: { questions: QuizQuestion[] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [variant, setVariant] = useState<ExamVariant | null>(null);
  const [seed, setSeed] = useState(0);
  const [pool, setPool] = useState<PresentationQuestion[]>([]);
  const [started, setStarted] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmUnanswered, setConfirmUnanswered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [persistenceWarning, setPersistenceWarning] = useState(false);
  const [completionFallback, setCompletionFallback] = useState<ExamCompletionFallback | null>(null);
  const submissionController = useMemo(() => createExamSubmissionController(), []);
  const question = pool[index];
  const reviewSummary = useMemo(
    () => createExamReviewSummary(pool, answers, flags),
    [answers, flags, pool],
  );

  submissionController.update({ variant: variant ?? undefined, pool, answers, flags });

  useEffect(() => {
    const restored = getActiveExamSession(questions);
    if (restored) {
      const restoredPool = restored.pool.map((item) =>
        "sourceQuestionId" in item
          ? item
          : presentQuestion(item, "practice_drill", { seed: restored.seed }),
      );
      setVariant(restored.variant);
      setSeed(restored.seed);
      setPool(restoredPool);
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
    if (!ready || !started || !variant || pool.length === 0) {
      return;
    }
    if (deadlineAt !== null && deadlineAt <= Date.now()) {
      return;
    }

    const session = variant === "legacy_timed"
      ? createActiveExamSession({
          questionIds: pool.map((item) => item.sourceQuestionId),
          answers,
          flags,
          currentIndex: index,
          remainingSeconds: secondsLeft ?? 0,
          deadlineAt: deadlineAt ?? Date.now(),
        })
      : createActiveExamSession({
          variant,
          seed,
          questions: pool,
          answers,
          flags,
          currentIndex: index,
          deadlineAt,
        });
    const saved = saveActiveExamSession(session);
    setPersistenceWarning(!saved);
  }, [answers, deadlineAt, flags, index, pool, ready, secondsLeft, seed, started, variant]);

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
    if (!started || deadlineAt === null) {
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
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [deadlineAt, started, submitExam]);

  function startExam(nextVariant: AssessmentVariant) {
    const nextSeed = createSeed();
    const nextPool =
      nextVariant === "faa_timed"
        ? buildFaaTimedExam(questions, { seed: nextSeed })
        : buildPracticeDrill(questions, {
            seed: nextSeed,
            count: DRILL_QUESTION_COUNT,
          });
    const nextDeadline =
      nextVariant === "faa_timed"
        ? Date.now() + FAA_EXAM_SECONDS * 1_000
        : null;

    submissionController.release();
    setVariant(nextVariant);
    setSeed(nextSeed);
    setPool(nextPool);
    setAnswers({});
    setFlags([]);
    setIndex(0);
    setSecondsLeft(nextVariant === "faa_timed" ? FAA_EXAM_SECONDS : null);
    setDeadlineAt(nextDeadline);
    setReviewOpen(false);
    setConfirmUnanswered(false);
    setCompletionFallback(null);
    setStarted(true);
    const saved = saveActiveExamSession(
      createActiveExamSession({
        variant: nextVariant,
        seed: nextSeed,
        questions: nextPool,
        answers: {},
        flags: [],
        currentIndex: 0,
        deadlineAt: nextDeadline,
      }),
    );
    setPersistenceWarning(!saved);
  }

  function selectAnswer(questionId: string, choiceIndex: number) {
    setAnswers((current) => {
      const next = {
        ...current,
        [questionId]: applyQuizAnswer(
          variant === "practice_drill" ? "study" : "assessment",
          current[questionId],
          choiceIndex,
        ),
      };
      submissionController.update({ variant: variant ?? undefined, pool, answers: next, flags });
      return next;
    });
  }

  function toggleFlag(questionId: string) {
    setFlags((current) => {
      const next = current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId];
      submissionController.update({ variant: variant ?? undefined, pool, answers, flags: next });
      return next;
    });
  }

  function requestManualSubmit() {
    const guard = getManualSubmitGuard(reviewSummary);
    if (guard.requiresConfirmation) {
      setConfirmUnanswered(true);
      return;
    }
    submitExam();
  }

  if (!ready) {
    return (
      <Card className={styles.examCard}>
        <CardContent className="p-6 text-slate-300">Loading assessment options…</CardContent>
      </Card>
    );
  }

  if (completionFallback) {
    const percent = Math.round((completionFallback.score / completionFallback.total) * 100);
    const messaging = getExamResultMessaging(completionFallback.variant, completionFallback.passed);
    return (
      <Card className={styles.examCard}>
        <CardHeader>
          <Badge variant={completionFallback.passed ? "sky" : "amber"} className="w-fit">
            {messaging.label}
          </Badge>
          <CardTitle className="text-3xl text-white">{messaging.title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-5xl font-bold text-primary">{percent}%</p>
          <p className="text-slate-300">Score: {completionFallback.score}/{completionFallback.total}</p>
          <p role="alert" className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            This result could not be saved and will disappear if you refresh this page. Detailed review was not saved.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <Card className={`${styles.examCard} ${styles.examStart}`}>
        <CardHeader>
          <Badge variant="sky" className="w-fit">Choose your practice format</Badge>
          <h1 className={styles.examPageTitle}>Calm focus for test-day decisions.</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Choose the closest FAA-style simulation or a broader study drill. Neither option is the actual FAA knowledge test.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className={styles.examOption}>
            <Plane className="h-8 w-8 text-amber-300" />
            <h2 className="mt-4 text-2xl font-bold text-white">FAA-like Timed Exam</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Closest practice simulation: {GOVERNED_FACTS.acsWeighting.totalQuestions} questions, {GOVERNED_FACTS.acsWeighting.testingTimeMinutes} minutes, a fixed ACS-aligned topic allocation within the current ranges, deterministic {PRESENTED_CHOICE_COUNT}-choice presentation, and first-answer locking.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="amber">{GOVERNED_FACTS.acsWeighting.totalQuestions} questions</Badge>
              <Badge variant="amber">{GOVERNED_FACTS.acsWeighting.testingTimeMinutes} minutes</Badge>
              <Badge variant="amber">{PRESENTED_CHOICE_COUNT} choices</Badge>
            </div>
            <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => startExam("faa_timed")}>
              Start FAA-like exam
            </Button>
          </div>
          <div className={styles.examOption}>
            <BookOpenCheck className="h-8 w-8 text-sky-300" />
            <h2 className="mt-4 text-2xl font-bold text-white">Practice Drill</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Broader study practice from the canonical question pool. All four original choices remain available, and answers may change.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="sky">Broad random pool</Badge>
              <Badge variant="sky">4 choices</Badge>
              <Badge variant="sky">Untimed</Badge>
            </div>
            <Button size="lg" variant="secondary" className="mt-5 w-full sm:w-auto" onClick={() => startExam("practice_drill")}>
              Start Practice Drill
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviewOpen) {
    return (
      <div className={styles.examReview}>
        <Card className={styles.examCard}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant={variant === "practice_drill" ? "sky" : "amber"}>
                {variant === "faa_timed" ? "FAA-like Timed Exam" : variant === "legacy_timed" ? "Resumed legacy timed practice exam" : "Practice Drill"}
              </Badge>
              {secondsLeft !== null ? (
                <span className="flex items-center gap-2 text-sm text-slate-300"><Timer className="h-4 w-4 text-primary" />{formatTime(secondsLeft)}</span>
              ) : null}
            </div>
            <h1 className={styles.examReviewTitle}>Review your answers</h1>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className={styles.examReviewSummary}>
              <div className="rounded-lg border border-emerald-300/20 p-3"><p className="text-2xl font-bold text-white">{reviewSummary.answered}</p><p className="text-xs text-slate-400">Answered</p></div>
              <div className="rounded-lg border border-white/10 p-3"><p className="text-2xl font-bold text-white">{reviewSummary.unanswered}</p><p className="text-xs text-slate-400">Unanswered</p></div>
              <div className="rounded-lg border border-amber-300/20 p-3"><p className="text-2xl font-bold text-white">{reviewSummary.flagged}</p><p className="text-xs text-slate-400">Flagged</p></div>
            </div>
            <div className={styles.examReviewGrid} aria-label="Question review grid">
              {pool.map((item, questionIndex) => (
                <button
                  key={item.sourceQuestionId}
                  type="button"
                  aria-label={`Go to question ${questionIndex + 1}${answers[item.sourceQuestionId] === undefined ? ", unanswered" : ", answered"}${flags.includes(item.sourceQuestionId) ? ", flagged" : ""}`}
                  onClick={() => {
                    setIndex(questionIndex);
                    setReviewOpen(false);
                    setConfirmUnanswered(false);
                  }}
                  className={cn(
                    styles.examReviewButton,
                    "h-11 rounded-md border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    answers[item.sourceQuestionId] !== undefined && "border-emerald-300/30 bg-emerald-300/15 text-emerald-50",
                    answers[item.sourceQuestionId] === undefined && "border-white/10 text-slate-300",
                    flags.includes(item.sourceQuestionId) && "ring-2 ring-amber-300",
                  )}
                >
                  {questionIndex + 1}
                </button>
              ))}
            </div>
            <Dialog.Root open={confirmUnanswered} onOpenChange={setConfirmUnanswered}>
              <Dialog.Portal>
                <Dialog.Overlay className={styles.examDialogOverlay} />
                <Dialog.Content className={styles.examDialogContent}>
                  <Dialog.Title className={styles.examDialogTitle}>Submit with {reviewSummary.unanswered} unanswered question{reviewSummary.unanswered === 1 ? "" : "s"}?</Dialog.Title>
                  <Dialog.Description className={styles.examDialogDescription}>Unanswered questions will be scored incorrect.</Dialog.Description>
                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close>
                    <Button onClick={submitExam}>Submit anyway</Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => { setReviewOpen(false); setConfirmUnanswered(false); }}>
                Return to questions
              </Button>
              <Button onClick={requestManualSubmit}>Submit {variant === "practice_drill" ? "drill" : "exam"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className={`${styles.examCard} ${styles.examActive}`}>
      <CardHeader className={styles.examActiveHeader}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant={variant === "practice_drill" ? "sky" : "amber"}>
            {variant === "faa_timed" ? "FAA-like Timed Exam · answer locks" : variant === "legacy_timed" ? "Resumed legacy timed practice exam · answer locks" : "Practice Drill · answers may change"}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            {secondsLeft !== null ? <><Timer className="h-4 w-4 text-primary" />{formatTime(secondsLeft)}</> : "Untimed"}
          </div>
        </div>
        <Progress value={Math.round((reviewSummary.answered / pool.length) * 100)} className="bg-white/10" aria-label={`${reviewSummary.answered} of ${pool.length} answered`} />
        {persistenceWarning ? (
          <p role="status" className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            Exam progress will not survive a refresh in this browser.
          </p>
        ) : null}
        <h1 className={styles.examActiveTitle}>Calm focus for test-day decisions.</h1>
        <h2 id={`question-prompt-${question.sourceQuestionId}`} className={styles.examQuestionTitle}>
          <span>Question {index + 1}</span>{question.prompt}
        </h2>
      </CardHeader>
      <CardContent className={styles.examQuestionBody}>
        <fieldset aria-labelledby={`question-prompt-${question.sourceQuestionId}`} className="m-0 min-w-0 border-0 p-0 grid gap-3">
          <legend className="sr-only">Answer choices</legend>
          <div role="radiogroup" aria-labelledby={`question-prompt-${question.sourceQuestionId}`} className="grid gap-3">
            {question.choices.map((choice, choiceIndex) => {
              const selected = answers[question.sourceQuestionId] === choiceIndex;
              const locked = variant !== "practice_drill" && answers[question.sourceQuestionId] !== undefined;
              return (
                <button
                  key={`${question.sourceQuestionId}-${choiceIndex}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={locked}
                  onClick={() => selectAnswer(question.sourceQuestionId, choiceIndex)}
                  className={cn(
                    styles.examAnswer,
                    selected && styles.examAnswerSelected,
                    "min-h-14 rounded-lg border p-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-80",
                    selected ? "border-primary bg-primary/15 text-white" : "border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.07]",
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </fieldset>
        {variant !== "practice_drill" && answers[question.sourceQuestionId] !== undefined ? (
          <p aria-live="polite" className="text-sm text-slate-300">Answer locked. Correctness is shown only after submission.</p>
        ) : null}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant={flags.includes(question.sourceQuestionId) ? "secondary" : "outline"} onClick={() => toggleFlag(question.sourceQuestionId)}>
            <Flag className="h-4 w-4" />
            {flags.includes(question.sourceQuestionId) ? "Flagged" : "Flag for review"}
          </Button>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>Previous</Button>
            <Button disabled={index === pool.length - 1} onClick={() => setIndex((current) => Math.min(pool.length - 1, current + 1))}>Next</Button>
            <Button className="col-span-2" variant="secondary" onClick={() => setReviewOpen(true)}>
              <ClipboardList className="h-4 w-4" />
              Review answers
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
