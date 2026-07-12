import { modules } from "@/lib/course-data";
import { flashcards } from "@/lib/flashcards";
import { examQuestions, moduleQuestions } from "@/lib/questions";
import type {
  ExamAttempt,
  ExamReviewItem,
  FlashcardProgress,
  ModuleProgress,
  NormalizeResult,
  ProgressDelta,
  ProgressState,
  QuizAttempt,
  RecentActivity,
  TopicArea,
} from "@/lib/types";

const MAX_PROGRESS_BYTES = 256 * 1024;
const MIN_TIMESTAMP_MS = Date.parse("2020-01-01T00:00:00.000Z");
const FUTURE_SKEW_MS = 5 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const TOPICS: TopicArea[] = [
  "Regulations",
  "Airspace",
  "Weather",
  "Loading & Performance",
  "Operations",
];
const TOPIC_SET = new Set<string>(TOPICS);
const MODULE_BY_ID = new Map(modules.map((courseModule) => [courseModule.id, courseModule]));
const FLASHCARDS_BY_MODULE = new Map<string, string[]>();
for (const card of flashcards) {
  const cards = FLASHCARDS_BY_MODULE.get(card.moduleId) ?? [];
  cards.push(card.id);
  FLASHCARDS_BY_MODULE.set(card.moduleId, cards);
}
const FLASHCARD_ORDER = new Map(flashcards.map((card, index) => [card.id, index]));
const MODULE_QUESTION_COUNTS = new Map<string, number>();
for (const question of moduleQuestions) {
  if (question.moduleId) {
    MODULE_QUESTION_COUNTS.set(
      question.moduleId,
      (MODULE_QUESTION_COUNTS.get(question.moduleId) ?? 0) + 1,
    );
  }
}
const EXAM_QUESTION_IDS = new Set(examQuestions.map((question) => question.id));

export const canonicalEmptyProgress: ProgressState = {
  version: 1,
  modules: {},
  quizAttempts: [],
  flashcards: {},
  examAttempts: [],
  recentActivity: [],
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && value.length <= 128 && UUID_PATTERN.test(value);
}

function validTimestamp(value: unknown, now: Date): value is string {
  if (typeof value !== "string" || !TIMESTAMP_PATTERN.test(value)) return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds)
    && new Date(milliseconds).toISOString() === value
    && milliseconds >= MIN_TIMESTAMP_MS
    && milliseconds <= now.getTime() + FUTURE_SKEW_MS;
}

function boundedString(value: unknown, maxBytes: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || utf8Bytes(trimmed) > maxBytes) return null;
  return trimmed;
}

function validInteger(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && Number.isInteger(value)
    && value >= minimum
    && value <= maximum;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareCanonical(left: unknown, right: unknown): number {
  return compareStrings(stableStringify(left), stableStringify(right));
}

function normalizeTopicScores(value: unknown): QuizAttempt["topicScores"] | null {
  if (!isPlainObject(value)) return null;
  const scores: QuizAttempt["topicScores"] = {};
  for (const topic of TOPICS) {
    const raw = value[topic];
    if (raw === undefined) continue;
    if (!isPlainObject(raw)
      || !validInteger(raw.correct)
      || !validInteger(raw.total, 0)
      || raw.correct > raw.total) {
      return null;
    }
    scores[topic] = { correct: raw.correct, total: raw.total };
  }
  return scores;
}

function normalizeModuleProgress(moduleId: string, value: unknown, now: Date): ModuleProgress | null {
  const courseModule = MODULE_BY_ID.get(moduleId);
  if (!courseModule || !isPlainObject(value) || !Array.isArray(value.visitedSlideIds)) return null;
  const slideOrder = new Map(courseModule.slides.map((slide, index) => [slide.id, index]));
  const visitedSlideIds = Array.from(new Set(
    value.visitedSlideIds.filter((slideId): slideId is string => typeof slideId === "string" && slideOrder.has(slideId)),
  )).sort((left, right) => (slideOrder.get(left) ?? 0) - (slideOrder.get(right) ?? 0));
  const progress: ModuleProgress = {
    visitedSlideIds,
    completed: visitedSlideIds.length === courseModule.slides.length,
  };
  const lastSlideId = typeof value.lastSlideId === "string" && visitedSlideIds.includes(value.lastSlideId)
    ? value.lastSlideId
    : visitedSlideIds.at(-1);
  if (lastSlideId) progress.lastSlideId = lastSlideId;
  if (validTimestamp(value.updatedAt, now)) progress.updatedAt = value.updatedAt;
  return progress;
}

function normalizeQuizAttempt(value: unknown, now: Date): QuizAttempt | null {
  if (!isPlainObject(value)
    || !validUuid(value.id)
    || typeof value.moduleId !== "string"
    || !MODULE_BY_ID.has(value.moduleId)
    || !validTimestamp(value.completedAt, now)) {
    return null;
  }
  const maximum = MODULE_QUESTION_COUNTS.get(value.moduleId) ?? 0;
  if (!validInteger(value.total, 1, maximum)
    || !validInteger(value.score, 0, value.total)
    || value.score > value.total) {
    return null;
  }
  const topicScores = normalizeTopicScores(value.topicScores);
  if (!topicScores) return null;
  const attempt: QuizAttempt = {
    id: value.id,
    moduleId: value.moduleId,
    score: value.score,
    total: value.total,
    topicScores,
    completedAt: value.completedAt,
  };
  if (value.mode === "study" || value.mode === "assessment") attempt.mode = value.mode;
  return attempt;
}

function normalizeReviewItem(value: unknown, attemptTotal: number): ExamReviewItem | null {
  if (!isPlainObject(value)
    || !validInteger(value.questionNumber, 1, attemptTotal)
    || typeof value.sourceQuestionId !== "string"
    || value.sourceQuestionId.length > 128
    || !EXAM_QUESTION_IDS.has(value.sourceQuestionId)
    || !TOPIC_SET.has(String(value.topic))
    || typeof value.correct !== "boolean"
    || typeof value.flagged !== "boolean") {
    return null;
  }
  const prompt = boundedString(value.prompt, 2048);
  const correctAnswer = boundedString(value.correctAnswer, 512);
  const explanation = boundedString(value.explanation, 4096);
  const selectedAnswer = value.selectedAnswer === null ? null : boundedString(value.selectedAnswer, 512);
  if (!prompt || !correctAnswer || !explanation || (value.selectedAnswer !== null && selectedAnswer === null)) return null;
  return {
    questionNumber: value.questionNumber,
    sourceQuestionId: value.sourceQuestionId,
    prompt,
    topic: value.topic as TopicArea,
    selectedAnswer,
    correctAnswer,
    correct: value.correct,
    explanation,
    flagged: value.flagged,
  };
}

function normalizeExamAttempt(value: unknown, now: Date): ExamAttempt | null {
  if (!isPlainObject(value)
    || !validUuid(value.id)
    || !validTimestamp(value.completedAt, now)
    || !validInteger(value.total, 1, examQuestions.length)
    || !validInteger(value.score, 0, value.total)
    || value.score > value.total
    || typeof value.passed !== "boolean"
    || !validInteger(value.flaggedCount, 0, value.total)) {
    return null;
  }
  const topicScores = normalizeTopicScores(value.topicScores);
  if (!topicScores) return null;
  const attempt: ExamAttempt = {
    id: value.id,
    score: value.score,
    total: value.total,
    passed: value.passed,
    topicScores,
    completedAt: value.completedAt,
    flaggedCount: value.flaggedCount,
  };
  if (value.variant === "faa_timed" || value.variant === "practice_drill" || value.variant === "legacy_timed") {
    attempt.variant = value.variant;
  }
  if (value.review !== undefined) {
    if (!Array.isArray(value.review) || value.review.length > value.total) return null;
    const review: ExamReviewItem[] = [];
    for (const item of value.review) {
      const normalized = normalizeReviewItem(item, value.total);
      if (!normalized) return null;
      review.push(normalized);
    }
    attempt.review = review.sort((left, right) => left.questionNumber - right.questionNumber || compareStrings(left.sourceQuestionId, right.sourceQuestionId));
  }
  return attempt;
}

function validLearnerRoute(value: string): boolean {
  const staticRoutes = new Set([
    "/", "/about", "/cram-sheet", "/dashboard", "/exam", "/exam/results",
    "/flashcards", "/login", "/modules", "/resources", "/signup", "/study-plan",
  ]);
  if (staticRoutes.has(value)) return true;
  const match = value.match(/^\/modules\/([^/]+)(?:\/(quiz|flashcards))?$/);
  return Boolean(match && MODULE_BY_ID.has(match[1]));
}

function normalizeActivity(value: unknown, now: Date): RecentActivity | null {
  if (!isPlainObject(value) || !validUuid(value.id) || !validTimestamp(value.at, now)) return null;
  const label = boundedString(value.label, 120);
  if (!label || typeof value.href !== "string" || utf8Bytes(value.href) > 256 || !validLearnerRoute(value.href)) return null;
  return { id: value.id, label, href: value.href, at: value.at };
}

function chooseDuplicate<T extends { id: string }>(
  values: T[],
  timestamp: (value: T) => string,
): T[] {
  const byId = new Map<string, T>();
  for (const value of values) {
    const existing = byId.get(value.id);
    if (!existing
      || timestamp(value) > timestamp(existing)
      || (timestamp(value) === timestamp(existing) && compareCanonical(value, existing) < 0)) {
      byId.set(value.id, value);
    }
  }
  return Array.from(byId.values());
}

function sortAttempts<T extends { id: string; completedAt: string }>(values: T[], limit: number): T[] {
  return chooseDuplicate(values, (value) => value.completedAt)
    .sort((left, right) => compareStrings(right.completedAt, left.completedAt) || compareStrings(left.id, right.id))
    .slice(0, limit);
}

function sortActivities(values: RecentActivity[]): RecentActivity[] {
  return chooseDuplicate(values, (value) => value.at)
    .sort((left, right) => compareStrings(right.at, left.at) || compareStrings(left.id, right.id))
    .slice(0, 8);
}

function normalizeFlashcardProgress(moduleId: string, value: unknown, now: Date): FlashcardProgress | null {
  const allowed = FLASHCARDS_BY_MODULE.get(moduleId);
  if (!allowed || !isPlainObject(value) || !Array.isArray(value.known) || !Array.isArray(value.unknown)) return null;
  const allowedSet = new Set(allowed);
  const knownSet = new Set(value.known.filter((id): id is string => typeof id === "string" && allowedSet.has(id)));
  const unknownSet = new Set(value.unknown.filter((id): id is string => typeof id === "string" && allowedSet.has(id) && !knownSet.has(id)));
  const progress: FlashcardProgress = {
    known: Array.from(knownSet).sort((left, right) => (FLASHCARD_ORDER.get(left) ?? 0) - (FLASHCARD_ORDER.get(right) ?? 0)),
    unknown: Array.from(unknownSet).sort((left, right) => (FLASHCARD_ORDER.get(left) ?? 0) - (FLASHCARD_ORDER.get(right) ?? 0)),
  };
  if (isPlainObject(value.reviewedAt)) {
    const reviewedAt: Record<string, string> = {};
    for (const cardId of [...progress.known, ...progress.unknown].sort((left, right) => (FLASHCARD_ORDER.get(left) ?? 0) - (FLASHCARD_ORDER.get(right) ?? 0))) {
      const timestamp = value.reviewedAt[cardId];
      if (validTimestamp(timestamp, now)) reviewedAt[cardId] = timestamp;
    }
    if (Object.keys(reviewedAt).length) progress.reviewedAt = reviewedAt;
  }
  return progress;
}

export function normalizeProgress(value: unknown, now = new Date()): NormalizeResult {
  if (!isPlainObject(value)) return { status: "invalid", reason: "Progress must be a plain object", raw: value };
  const version = value.version;
  if (version !== undefined) {
    if (!validInteger(version, 1)) return { status: "invalid", reason: "Progress version must be a positive integer", raw: value };
    if (version > 1) return { status: "unsupported", version, raw: value };
  }

  const normalizedModules: ProgressState["modules"] = {};
  if (isPlainObject(value.modules)) {
    for (const courseModule of modules) {
      if (!(courseModule.id in value.modules)) continue;
      const progress = normalizeModuleProgress(courseModule.id, value.modules[courseModule.id], now);
      if (progress) normalizedModules[courseModule.id] = progress;
    }
  }

  const normalizedFlashcards: ProgressState["flashcards"] = {};
  if (isPlainObject(value.flashcards)) {
    for (const courseModule of modules) {
      if (!(courseModule.id in value.flashcards)) continue;
      const progress = normalizeFlashcardProgress(courseModule.id, value.flashcards[courseModule.id], now);
      if (progress) normalizedFlashcards[courseModule.id] = progress;
    }
  }

  const quizAttempts = Array.isArray(value.quizAttempts)
    ? value.quizAttempts.map((attempt) => normalizeQuizAttempt(attempt, now)).filter((attempt): attempt is QuizAttempt => attempt !== null)
    : [];
  const examAttempts = Array.isArray(value.examAttempts)
    ? value.examAttempts.map((attempt) => normalizeExamAttempt(attempt, now)).filter((attempt): attempt is ExamAttempt => attempt !== null)
    : [];
  const recentActivity = Array.isArray(value.recentActivity)
    ? value.recentActivity.map((activity) => normalizeActivity(activity, now)).filter((activity): activity is RecentActivity => activity !== null)
    : [];

  const progress: ProgressState = {
    version: 1,
    modules: normalizedModules,
    quizAttempts: sortAttempts(quizAttempts, 30),
    flashcards: normalizedFlashcards,
    examAttempts: sortAttempts(examAttempts, 10),
    recentActivity: sortActivities(recentActivity),
  };
  if (utf8Bytes(stableStringify(progress)) > MAX_PROGRESS_BYTES) {
    return { status: "invalid", reason: "Canonical progress exceeds the 256 KiB limit", raw: value };
  }
  return { status: "ok", progress };
}

function requireNormalized(progress: ProgressState, now: Date): ProgressState {
  const result = normalizeProgress(progress, now);
  if (result.status !== "ok") throw new Error(result.status === "unsupported" ? `Unsupported progress version ${result.version}` : result.reason);
  return result.progress;
}

function mergeModules(local: ProgressState, remote: ProgressState): ProgressState["modules"] {
  const merged: ProgressState["modules"] = {};
  for (const courseModule of modules) {
    const localProgress = local.modules[courseModule.id];
    const remoteProgress = remote.modules[courseModule.id];
    if (!localProgress && !remoteProgress) continue;
    const slideOrder = new Map(courseModule.slides.map((slide, index) => [slide.id, index]));
    const visitedSlideIds = Array.from(new Set([
      ...(localProgress?.visitedSlideIds ?? []),
      ...(remoteProgress?.visitedSlideIds ?? []),
    ])).sort((left, right) => (slideOrder.get(left) ?? 0) - (slideOrder.get(right) ?? 0));
    const localTime = localProgress?.updatedAt;
    const remoteTime = remoteProgress?.updatedAt;
    let preferred = localProgress ?? remoteProgress;
    if (remoteTime && (!localTime || remoteTime > localTime)) preferred = remoteProgress;
    if (remoteTime && localTime && remoteTime === localTime) {
      preferred = (localProgress?.lastSlideId ?? "") <= (remoteProgress?.lastSlideId ?? "") ? localProgress : remoteProgress;
    }
    const lastSlideId = preferred?.lastSlideId && visitedSlideIds.includes(preferred.lastSlideId)
      ? preferred.lastSlideId
      : visitedSlideIds.at(-1);
    const moduleProgress: ModuleProgress = {
      visitedSlideIds,
      completed: visitedSlideIds.length === courseModule.slides.length,
    };
    if (lastSlideId) moduleProgress.lastSlideId = lastSlideId;
    const updatedAt = [localTime, remoteTime].filter((item): item is string => Boolean(item)).sort().at(-1);
    if (updatedAt) moduleProgress.updatedAt = updatedAt;
    merged[courseModule.id] = moduleProgress;
  }
  return merged;
}

function cardState(progress: FlashcardProgress | undefined, cardId: string): "known" | "unknown" | null {
  if (progress?.known.includes(cardId)) return "known";
  if (progress?.unknown.includes(cardId)) return "unknown";
  return null;
}

function mergeFlashcards(local: ProgressState, remote: ProgressState): ProgressState["flashcards"] {
  const merged: ProgressState["flashcards"] = {};
  for (const courseModule of modules) {
    const cards = FLASHCARDS_BY_MODULE.get(courseModule.id) ?? [];
    const localProgress = local.flashcards[courseModule.id];
    const remoteProgress = remote.flashcards[courseModule.id];
    if (!localProgress && !remoteProgress) continue;
    const deck: FlashcardProgress = { known: [], unknown: [] };
    const reviewedAt: Record<string, string> = {};
    for (const cardId of cards) {
      const localState = cardState(localProgress, cardId);
      const remoteState = cardState(remoteProgress, cardId);
      if (!localState && !remoteState) continue;
      const localTime = localProgress?.reviewedAt?.[cardId];
      const remoteTime = remoteProgress?.reviewedAt?.[cardId];
      let state = localState ?? remoteState;
      let timestamp = localTime ?? remoteTime;
      if (localState === remoteState) {
        timestamp = [localTime, remoteTime].filter((item): item is string => Boolean(item)).sort().at(-1);
      } else if (localTime || remoteTime) {
        if (!localTime || (remoteTime && remoteTime > localTime)) {
          state = remoteState;
          timestamp = remoteTime;
        } else if (!remoteTime || localTime > remoteTime) {
          state = localState;
          timestamp = localTime;
        } else {
          state = [localState, remoteState].filter((item): item is "known" | "unknown" => Boolean(item)).sort()[0] ?? null;
          timestamp = localTime;
        }
      }
      if (state) deck[state].push(cardId);
      if (state && timestamp) reviewedAt[cardId] = timestamp;
    }
    if (Object.keys(reviewedAt).length) deck.reviewedAt = reviewedAt;
    merged[courseModule.id] = deck;
  }
  return merged;
}

export function mergeProgress(local: ProgressState, remote: ProgressState, now = new Date()): ProgressState {
  const normalizedLocal = requireNormalized(local, now);
  const normalizedRemote = requireNormalized(remote, now);
  const merged: ProgressState = {
    version: 1,
    modules: mergeModules(normalizedLocal, normalizedRemote),
    quizAttempts: sortAttempts([...normalizedLocal.quizAttempts, ...normalizedRemote.quizAttempts], 30),
    flashcards: mergeFlashcards(normalizedLocal, normalizedRemote),
    examAttempts: sortAttempts([...normalizedLocal.examAttempts, ...normalizedRemote.examAttempts], 10),
    recentActivity: sortActivities([...normalizedLocal.recentActivity, ...normalizedRemote.recentActivity]),
  };
  return requireNormalized(merged, now);
}

export function deriveProgressDelta(base: ProgressState, proposed: ProgressState, now = new Date()): ProgressDelta {
  return { base: requireNormalized(base, now), proposed: requireNormalized(proposed, now) };
}

export function applyProgressDelta(current: ProgressState, delta: ProgressDelta, now = new Date()): ProgressState {
  const base = requireNormalized(delta.base, now);
  const proposed = requireNormalized(delta.proposed, now);
  const changed: ProgressState = {
    version: 1,
    modules: {},
    quizAttempts: [],
    flashcards: {},
    examAttempts: [],
    recentActivity: [],
  };

  for (const courseModule of modules) {
    const baseModule = base.modules[courseModule.id];
    const proposedModule = proposed.modules[courseModule.id];
    if (!proposedModule) continue;
    const addedSlides = proposedModule.visitedSlideIds.filter(
      (slideId) => !baseModule?.visitedSlideIds.includes(slideId),
    );
    const navigationChanged = proposedModule.lastSlideId !== baseModule?.lastSlideId
      || proposedModule.updatedAt !== baseModule?.updatedAt;
    if (!addedSlides.length && !navigationChanged) continue;
    const moduleProgress: ModuleProgress = {
      visitedSlideIds: navigationChanged ? proposedModule.visitedSlideIds : addedSlides,
      completed: false,
    };
    if (navigationChanged && proposedModule.lastSlideId) moduleProgress.lastSlideId = proposedModule.lastSlideId;
    if (navigationChanged && proposedModule.updatedAt) moduleProgress.updatedAt = proposedModule.updatedAt;
    changed.modules[courseModule.id] = moduleProgress;
  }

  for (const courseModule of modules) {
    const cards = FLASHCARDS_BY_MODULE.get(courseModule.id) ?? [];
    const baseDeck = base.flashcards[courseModule.id];
    const proposedDeck = proposed.flashcards[courseModule.id];
    if (!proposedDeck) continue;
    const deck: FlashcardProgress = { known: [], unknown: [] };
    const reviewedAt: Record<string, string> = {};
    for (const cardId of cards) {
      const baseState = cardState(baseDeck, cardId);
      const proposedState = cardState(proposedDeck, cardId);
      const baseTime = baseDeck?.reviewedAt?.[cardId];
      const proposedTime = proposedDeck.reviewedAt?.[cardId];
      if (baseState === proposedState && baseTime === proposedTime) continue;
      if (proposedState) deck[proposedState].push(cardId);
      if (proposedState && proposedTime) reviewedAt[cardId] = proposedTime;
    }
    if (deck.known.length || deck.unknown.length) {
      if (Object.keys(reviewedAt).length) deck.reviewedAt = reviewedAt;
      changed.flashcards[courseModule.id] = deck;
    }
  }

  const changedRecords = <T extends { id: string }>(baseRecords: T[], proposedRecords: T[]) => {
    const baseById = new Map(baseRecords.map((record) => [record.id, stableStringify(record)]));
    return proposedRecords.filter((record) => baseById.get(record.id) !== stableStringify(record));
  };
  changed.quizAttempts = changedRecords(base.quizAttempts, proposed.quizAttempts);
  changed.examAttempts = changedRecords(base.examAttempts, proposed.examAttempts);
  changed.recentActivity = changedRecords(base.recentActivity, proposed.recentActivity);

  return mergeProgress(changed, current, now);
}

export function canonicalProgressJson(progress: ProgressState, now = new Date()): string {
  return stableStringify(requireNormalized(progress, now));
}
