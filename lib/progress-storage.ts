"use client";

import { useEffect, useState } from "react";
import type {
  AuthenticatedProgressCacheEnvelope,
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
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DECIMAL_PATTERN = /^(0|[1-9][0-9]*)$/;

let activeProgressOwnerUserId: string | null = null;
const progressWriteListeners = new Set<(progress: ProgressState, ownerUserId: string | null) => void>();

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

function progressKey() {
  return activeProgressOwnerUserId ? `${STORAGE_KEY}:${activeProgressOwnerUserId}` : STORAGE_KEY;
}

function isAuthenticatedEnvelope(value: unknown): value is AuthenticatedProgressCacheEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const envelope = value as Partial<AuthenticatedProgressCacheEnvelope>;
  if (envelope.envelopeVersion !== 1 || !envelope.progress || envelope.progress.version !== 1) {
    return false;
  }
  const neverSynced = envelope.resetGeneration === null
    && envelope.resetEpoch === null
    && envelope.revision === null
    && envelope.baseProgress === null;
  const tagged = typeof envelope.resetGeneration === "string"
    && UUID_PATTERN.test(envelope.resetGeneration)
    && typeof envelope.resetEpoch === "string"
    && DECIMAL_PATTERN.test(envelope.resetEpoch)
    && typeof envelope.revision === "string"
    && DECIMAL_PATTERN.test(envelope.revision)
    && Boolean(envelope.baseProgress)
    && envelope.baseProgress?.version === 1;
  return neverSynced || tagged;
}

export function setProgressOwner(userId: string | null) {
  if (userId !== null && !UUID_PATTERN.test(userId)) {
    throw new Error("Progress owner must be a valid lowercase UUID");
  }
  activeProgressOwnerUserId = userId;
}

export function getProgressOwner() {
  return activeProgressOwnerUserId;
}

export function subscribeProgressWrites(
  listener: (progress: ProgressState, ownerUserId: string | null) => void,
) {
  progressWriteListeners.add(listener);
  return () => progressWriteListeners.delete(listener);
}

export function getProgress(): ProgressState {
  if (!isBrowser()) {
    return emptyProgress;
  }

  try {
    const raw = window.localStorage.getItem(progressKey());
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as unknown;
    if (activeProgressOwnerUserId) {
      return isAuthenticatedEnvelope(parsed) ? normalizeProgress(parsed.progress) : emptyProgress;
    }
    return normalizeProgress(parsed);
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: ProgressState) {
  if (!isBrowser()) {
    return;
  }

  const key = progressKey();
  if (activeProgressOwnerUserId) {
    const raw = window.localStorage.getItem(key);
    let envelope: AuthenticatedProgressCacheEnvelope;
    if (raw === null) {
      envelope = {
        envelopeVersion: 1,
        progress,
        resetGeneration: null,
        resetEpoch: null,
        revision: null,
        baseProgress: null,
      };
    } else {
      const parsed = JSON.parse(raw) as unknown;
      if (!isAuthenticatedEnvelope(parsed)) {
        throw new Error("Cannot overwrite an unverified authenticated cache");
      }
      envelope = { ...parsed, progress };
    }
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } else {
    window.localStorage.setItem(key, JSON.stringify(progress));
  }
  window.dispatchEvent(new Event("faa107-progress"));
  progressWriteListeners.forEach((listener) => {
    listener(progress, activeProgressOwnerUserId);
  });
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
    const nextModule = {
      visitedSlideIds,
      lastSlideId: slideId,
      completed: visitedSlideIds.length >= totalSlides,
      ...(slideId.startsWith(`m${moduleId}-`) ? { updatedAt: new Date().toISOString() } : {}),
    };
    return {
      ...current,
      modules: {
        ...current.modules,
        [moduleId]: nextModule,
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
  updateProgress((current) => {
    const existing = current.flashcards[moduleId] ?? { known: [], unknown: [] };
    const known = unique(progress.known);
    const unknown = unique(progress.unknown).filter((cardId) => !known.includes(cardId));
    const previousState = new Map<string, "known" | "unknown">([
      ...existing.known.map((cardId) => [cardId, "known"] as const),
      ...existing.unknown.map((cardId) => [cardId, "unknown"] as const),
    ]);
    const nextState = new Map<string, "known" | "unknown">([
      ...known.map((cardId) => [cardId, "known"] as const),
      ...unknown.map((cardId) => [cardId, "unknown"] as const),
    ]);
    const reviewedAt = { ...(existing.reviewedAt ?? {}), ...(progress.reviewedAt ?? {}) };
    const timestamp = new Date().toISOString();
    nextState.forEach((state, cardId) => {
      if (previousState.get(cardId) !== state) reviewedAt[cardId] = timestamp;
    });
    return {
      ...current,
      flashcards: {
        ...current.flashcards,
        [moduleId]: {
          known,
          unknown,
          ...(Object.keys(reviewedAt).length ? { reviewedAt } : {}),
        },
      },
    };
  });
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
