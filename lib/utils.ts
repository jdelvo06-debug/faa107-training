import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { QuizQuestion, TopicArea } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function topicScores(questions: QuizQuestion[], answers: Record<string, number>) {
  const totals: Partial<Record<TopicArea, { correct: number; total: number }>> = {};
  for (const question of questions) {
    totals[question.topic] = totals[question.topic] ?? { correct: 0, total: 0 };
    totals[question.topic]!.total += 1;
    if (answers[question.id] === question.correctIndex) {
      totals[question.topic]!.correct += 1;
    }
  }
  return totals;
}
