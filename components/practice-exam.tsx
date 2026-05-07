"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Timer, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { addActivity, saveExamAttempt } from "@/lib/progress-storage";
import type { QuizQuestion } from "@/lib/types";
import { cn, topicScores } from "@/lib/utils";

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
  const pool = useMemo(() => shuffled(questions).slice(0, 60), [questions]);
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEMO_SECONDS);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const question = pool[index];
  const score = useMemo(
    () => pool.filter((item) => answers[item.id] === item.correctIndex).length,
    [answers, pool]
  );
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (!started) {
      return;
    }
    const id = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          submitExam();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  function submitExam() {
    const total = pool.length;
    const attempt = {
      score,
      total,
      passed: score / total >= 0.7,
      topicScores: topicScores(pool, answers),
      flaggedCount: flags.length
    };
    saveExamAttempt(attempt);
    addActivity({
      label: `Completed practice exam: ${score}/${total}`,
      href: "/exam/results"
    });
    router.push("/exam/results");
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
          <Button className="w-fit" size="lg" onClick={() => setStarted(true)}>
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
                onClick={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))}
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
              onClick={() =>
                setFlags((current) =>
                  current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id]
                )
              }
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
