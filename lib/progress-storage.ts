"use client";

import { useEffect, useState } from "react";
import type {
  ExamAttempt,
  FlashcardProgress,
  ProgressState,
  QuizQuestion,
  QuizAttempt,
  RecentActivity
} from "@/lib/types";
import {
  restoreActiveExamSession,
  type ActiveExamSession,
  type RestoredExamSession
} from "@/lib/exam-session";

const STORAGE_KEY = "faa107-progress-v1";
const ACTIVE_EXAM_KEY = "faa107-active-exam-v1";

export const emptyProgress: ProgressState = {
  version: 1,
  modules: {},
  quizAttempts: [],
  flashcards: {},
  examAttempts: [],
  recentActivity: []
};

function isBrowser() {
  return typeof window !== "undefined";
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function normalizeProgress(value: unknown): ProgressState {
  if (!value || typeof value !== "object") {
    return emptyProgress;
  }

  const maybe = value as Partial<ProgressState>;
  return {
    version: 1,
    modules: maybe.modules ?? {},
    quizAttempts: maybe.quizAttempts ?? [],
    flashcards: maybe.flashcards ?? {},
    examAttempts: maybe.examAttempts ?? [],
    recentActivity: maybe.recentActivity ?? []
  };
}

export function getProgress(): ProgressState {
  if (!isBrowser()) {
    return emptyProgress;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProgress(JSON.parse(raw)) : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: ProgressState) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event("faa107-progress"));
}

export function updateProgress(updater: (current: ProgressState) => ProgressState) {
  const next = updater(getProgress());
  saveProgress(next);
  return next;
}

export function addActivity(activity: Omit<RecentActivity, "id" | "at">) {
  updateProgress((current) => ({
    ...current,
    recentActivity: [
      {
        ...activity,
        id: crypto.randomUUID(),
        at: new Date().toISOString()
      },
      ...current.recentActivity
    ].slice(0, 8)
  }));
}

export function markSlideVisited(moduleId: string, slideId: string, totalSlides: number) {
  updateProgress((current) => {
    const existing = current.modules[moduleId] ?? {
      visitedSlideIds: [],
      completed: false
    };
    const visitedSlideIds = unique([...existing.visitedSlideIds, slideId]);
    return {
      ...current,
      modules: {
        ...current.modules,
        [moduleId]: {
          visitedSlideIds,
          lastSlideId: slideId,
          completed: visitedSlideIds.length >= totalSlides
        }
      }
    };
  });
}

export function saveQuizAttempt(attempt: Omit<QuizAttempt, "id" | "completedAt">) {
  updateProgress((current) => ({
    ...current,
    quizAttempts: [
      {
        ...attempt,
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString()
      },
      ...current.quizAttempts
    ].slice(0, 30)
  }));
}

export function saveExamAttempt(attempt: Omit<ExamAttempt, "id" | "completedAt">) {
  updateProgress((current) => ({
    ...current,
    examAttempts: [
      {
        ...attempt,
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString()
      },
      ...current.examAttempts
    ].slice(0, 10)
  }));
}

export function saveActiveExamSession(session: ActiveExamSession) {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.setItem(ACTIVE_EXAM_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function getActiveExamSession(
  questions: QuizQuestion[],
  now = Date.now()
): RestoredExamSession | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_EXAM_KEY);
    if (!raw) {
      return null;
    }
    const restored = restoreActiveExamSession(JSON.parse(raw), questions, now);
    if (!restored) {
      clearActiveExamSession();
    }
    return restored;
  } catch {
    clearActiveExamSession();
    return null;
  }
}

export function clearActiveExamSession() {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.removeItem(ACTIVE_EXAM_KEY);
    return true;
  } catch {
    return false;
  }
}

export interface ExamCompletionResult {
  persisted: boolean;
  activeSessionCleared: boolean;
}

export function completeExamAttempt(
  attempt: Omit<ExamAttempt, "id" | "completedAt">,
): ExamCompletionResult {
  const completedAt = new Date().toISOString();
  let persisted = false;

  try {
    updateProgress((current) => ({
      ...current,
      examAttempts: [
        {
          ...attempt,
          id: crypto.randomUUID(),
          completedAt
        },
        ...current.examAttempts
      ].slice(0, 10),
      recentActivity: [
        {
          id: crypto.randomUUID(),
          at: completedAt,
          label: `Completed practice exam: ${attempt.score}/${attempt.total}`,
          href: "/exam/results"
        },
        ...current.recentActivity
      ].slice(0, 8)
    }));
    persisted = true;
  } catch {
    persisted = false;
  }

  return {
    persisted,
    activeSessionCleared: clearActiveExamSession()
  };
}

export function saveFlashcardProgress(moduleId: string, progress: FlashcardProgress) {
  updateProgress((current) => ({
    ...current,
    flashcards: {
      ...current.flashcards,
      [moduleId]: {
        known: unique(progress.known),
        unknown: unique(progress.unknown)
      }
    }
  }));
}

export function resetProgress() {
  saveProgress(emptyProgress);
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);

  useEffect(() => {
    const refresh = () => setProgress(getProgress());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("faa107-progress", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("faa107-progress", refresh);
    };
  }, []);

  return progress;
}
