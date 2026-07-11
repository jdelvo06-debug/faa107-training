import { restorePresentationQuestion } from "@/lib/assessment-engine";
import type {
  AssessmentVariant,
  ExamAttempt,
  ExamVariant,
  PresentationMetadata,
  PresentationQuestion,
  QuizQuestion,
  TopicArea,
} from "@/lib/types";

export const ACTIVE_EXAM_VERSION = 2;
const LEGACY_ACTIVE_EXAM_VERSION = 1;

export interface LegacyActiveExamSession {
  version: typeof LEGACY_ACTIVE_EXAM_VERSION;
  started: true;
  questionIds: string[];
  answers: Record<string, number>;
  flags: string[];
  currentIndex: number;
  deadlineAt: number;
}

export interface StoredPresentationQuestion {
  sourceQuestionId: string;
  presentation: PresentationMetadata;
}

export interface ActiveExamSessionV2 {
  version: typeof ACTIVE_EXAM_VERSION;
  started: true;
  variant: AssessmentVariant;
  seed: number;
  questions: StoredPresentationQuestion[];
  answers: Record<string, number>;
  flags: string[];
  currentIndex: number;
  deadlineAt: number | null;
}

export type ActiveExamSession = LegacyActiveExamSession | ActiveExamSessionV2;
type ExamQuestion = QuizQuestion | PresentationQuestion;

interface ExamSnapshot {
  variant?: ExamVariant;
  pool: ExamQuestion[];
  answers: Record<string, number>;
  flags: string[];
}

export interface RestoredExamSession extends ExamSnapshot {
  variant: ExamVariant;
  seed: number;
  started: true;
  currentIndex: number;
  secondsLeft: number | null;
  deadlineAt: number | null;
}

interface LegacySessionState {
  questionIds: string[];
  answers: Record<string, number>;
  flags: string[];
  currentIndex: number;
  remainingSeconds: number;
  deadlineAt?: number;
}

interface Version2SessionState {
  variant: AssessmentVariant;
  seed: number;
  questions: PresentationQuestion[];
  answers: Record<string, number>;
  flags: string[];
  currentIndex: number;
  remainingSeconds?: number;
  deadlineAt?: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function questionId(question: ExamQuestion) {
  return "sourceQuestionId" in question ? question.sourceQuestionId : question.id;
}

function isVersion2State(
  state: LegacySessionState | Version2SessionState,
): state is Version2SessionState {
  return "questions" in state;
}

export function createActiveExamSession(
  state: LegacySessionState | Version2SessionState,
  now = Date.now(),
): ActiveExamSession {
  if (!isVersion2State(state)) {
    return {
      version: LEGACY_ACTIVE_EXAM_VERSION,
      started: true,
      questionIds: [...state.questionIds],
      answers: { ...state.answers },
      flags: [...state.flags],
      currentIndex: state.currentIndex,
      deadlineAt: state.deadlineAt ?? now + state.remainingSeconds * 1_000,
    };
  }

  return {
    version: ACTIVE_EXAM_VERSION,
    started: true,
    variant: state.variant,
    seed: state.seed,
    questions: state.questions.map((question) => ({
      sourceQuestionId: question.sourceQuestionId,
      presentation: {
        variant: question.presentation.variant,
        seed: question.presentation.seed,
        sourceChoiceIndexes: [...question.presentation.sourceChoiceIndexes],
      },
    })),
    answers: { ...state.answers },
    flags: [...state.flags],
    currentIndex: state.currentIndex,
    deadlineAt:
      state.deadlineAt === null
        ? null
        : state.deadlineAt ??
          (state.remainingSeconds === undefined
            ? null
            : now + state.remainingSeconds * 1_000),
  };
}

function validateLearnerState(
  pool: ExamQuestion[],
  answers: unknown,
  flags: unknown,
  currentIndex: unknown,
) {
  if (
    !isRecord(answers) ||
    !Array.isArray(flags) ||
    !flags.every((id): id is string => typeof id === "string") ||
    new Set(flags).size !== flags.length ||
    !Number.isInteger(currentIndex) ||
    (currentIndex as number) < 0 ||
    (currentIndex as number) >= pool.length
  ) {
    return null;
  }

  const questionsById = new Map(pool.map((question) => [questionId(question), question]));
  if (
    !Object.entries(answers).every(([id, answer]) => {
      const question = questionsById.get(id);
      return (
        question !== undefined &&
        Number.isInteger(answer) &&
        (answer as number) >= 0 &&
        (answer as number) < question.choices.length
      );
    }) ||
    !flags.every((id) => questionsById.has(id))
  ) {
    return null;
  }

  return {
    answers: answers as Record<string, number>,
    flags,
    currentIndex: currentIndex as number,
  };
}

function restoreLegacySession(
  value: Record<string, unknown>,
  questions: QuizQuestion[],
  now: number,
): RestoredExamSession | null {
  const questionIds = value.questionIds;
  const deadlineAt = value.deadlineAt;
  const expectedQuestionCount = Math.min(60, questions.length);
  if (
    value.started !== true ||
    !Array.isArray(questionIds) ||
    questionIds.length !== expectedQuestionCount ||
    !questionIds.every((id): id is string => typeof id === "string") ||
    new Set(questionIds).size !== questionIds.length ||
    typeof deadlineAt !== "number" ||
    !Number.isFinite(deadlineAt) ||
    deadlineAt < 0
  ) {
    return null;
  }

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const pool = questionIds.map((id) => questionsById.get(id));
  if (pool.some((question) => !question)) {
    return null;
  }
  const learnerState = validateLearnerState(
    pool as QuizQuestion[],
    value.answers,
    value.flags,
    value.currentIndex,
  );
  if (!learnerState) {
    return null;
  }

  return {
    variant: "legacy_timed",
    seed: 0,
    started: true,
    pool: pool as QuizQuestion[],
    ...learnerState,
    secondsLeft: Math.max(0, Math.ceil((deadlineAt - now) / 1_000)),
    deadlineAt,
  };
}

function restoreVersion2Session(
  value: Record<string, unknown>,
  questions: QuizQuestion[],
  now: number,
): RestoredExamSession | null {
  const variant = value.variant;
  const seed = value.seed;
  const storedQuestions = value.questions;
  const deadlineAt = value.deadlineAt;
  if (
    value.started !== true ||
    (variant !== "faa_timed" && variant !== "practice_drill") ||
    !Number.isSafeInteger(seed) ||
    !Array.isArray(storedQuestions) ||
    storedQuestions.length === 0 ||
    !storedQuestions.every(isRecord) ||
    !(
      deadlineAt === null ||
      (typeof deadlineAt === "number" && Number.isFinite(deadlineAt) && deadlineAt >= 0)
    ) ||
    (variant === "faa_timed" && storedQuestions.length !== 60) ||
    (variant === "faa_timed" && deadlineAt === null)
  ) {
    return null;
  }

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const seenIds = new Set<string>();
  const pool: PresentationQuestion[] = [];
  try {
    for (const stored of storedQuestions) {
      const sourceQuestionId = stored.sourceQuestionId;
      const presentation = stored.presentation;
      if (
        typeof sourceQuestionId !== "string" ||
        seenIds.has(sourceQuestionId) ||
        !isRecord(presentation) ||
        presentation.variant !== variant ||
        !Number.isSafeInteger(presentation.seed) ||
        presentation.seed !== seed ||
        !Array.isArray(presentation.sourceChoiceIndexes)
      ) {
        return null;
      }
      const canonical = questionsById.get(sourceQuestionId);
      if (!canonical) {
        return null;
      }
      seenIds.add(sourceQuestionId);
      pool.push(
        restorePresentationQuestion(canonical, {
          variant,
          seed: presentation.seed as number,
          sourceChoiceIndexes: presentation.sourceChoiceIndexes as number[],
        }),
      );
    }
  } catch {
    return null;
  }

  const learnerState = validateLearnerState(
    pool,
    value.answers,
    value.flags,
    value.currentIndex,
  );
  if (!learnerState) {
    return null;
  }

  return {
    variant,
    seed: seed as number,
    started: true,
    pool,
    ...learnerState,
    secondsLeft:
      deadlineAt === null
        ? null
        : Math.max(0, Math.ceil(((deadlineAt as number) - now) / 1_000)),
    deadlineAt: deadlineAt as number | null,
  };
}

export function restoreActiveExamSession(
  value: unknown,
  questions: QuizQuestion[],
  now = Date.now(),
): RestoredExamSession | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.version === LEGACY_ACTIVE_EXAM_VERSION) {
    return restoreLegacySession(value, questions, now);
  }
  if (value.version === ACTIVE_EXAM_VERSION) {
    return restoreVersion2Session(value, questions, now);
  }
  return null;
}

export interface ExamReviewSummary {
  answered: number;
  unanswered: number;
  flagged: number;
  total: number;
}

export function createExamReviewSummary(
  pool: ExamQuestion[],
  answers: Record<string, number>,
  flags: string[],
): ExamReviewSummary {
  const ids = new Set(pool.map(questionId));
  const answered = Object.keys(answers).filter((id) => ids.has(id)).length;
  return {
    answered,
    unanswered: pool.length - answered,
    flagged: flags.filter((id) => ids.has(id)).length,
    total: pool.length,
  };
}

export function getManualSubmitGuard(summary: ExamReviewSummary) {
  return {
    requiresConfirmation: summary.unanswered > 0,
    unanswered: summary.unanswered,
  };
}

export function getExamResultMessaging(
  variant: ExamVariant | undefined,
  passed: boolean,
) {
  if (variant === "practice_drill") {
    return {
      label: "Practice Drill",
      title: "Drill complete",
      action: "Start another drill",
      assessment: false,
    } as const;
  }
  if (variant === "legacy_timed") {
    return {
      label: "Resumed legacy timed practice exam",
      title: "Legacy timed practice complete",
      action: "Choose new practice",
      assessment: true,
    } as const;
  }
  return {
    label: "FAA-like Timed Exam",
    title: passed ? "Passing score" : "Keep studying",
    action: "Retake exam",
    assessment: true,
  } as const;
}

function buildExamAttempt(
  snapshot: ExamSnapshot,
): Omit<ExamAttempt, "id" | "completedAt"> {
  const topicScores: Partial<Record<TopicArea, { correct: number; total: number }>> = {};
  let score = 0;
  const review = snapshot.pool.map((question, index) => {
    const id = questionId(question);
    const selectedIndex = snapshot.answers[id];
    const correct = selectedIndex === question.correctIndex;
    const topicScore = topicScores[question.topic] ?? { correct: 0, total: 0 };
    topicScore.total += 1;
    if (correct) {
      topicScore.correct += 1;
      score += 1;
    }
    topicScores[question.topic] = topicScore;
    return {
      questionNumber: index + 1,
      sourceQuestionId: id,
      prompt: question.prompt,
      topic: question.topic,
      selectedAnswer:
        selectedIndex === undefined ? null : question.choices[selectedIndex] ?? null,
      correctAnswer: question.choices[question.correctIndex],
      correct,
      explanation: question.explanation,
      flagged: snapshot.flags.includes(id),
    };
  });

  const total = snapshot.pool.length;
  return {
    score,
    total,
    passed: total > 0 && score / total >= 0.7,
    topicScores,
    flaggedCount: snapshot.flags.length,
    ...(snapshot.variant ? { variant: snapshot.variant } : {}),
    review,
  };
}

export interface ExamCompletionFallback {
  score: number;
  total: number;
  passed: boolean;
  variant?: ExamVariant;
}

export interface ExamCompletionOutcome {
  route: "/exam/results" | null;
  fallback: ExamCompletionFallback | null;
}

export function createExamCompletionOutcome(
  attempt: Omit<ExamAttempt, "id" | "completedAt">,
  persisted: boolean,
): ExamCompletionOutcome {
  return persisted
    ? { route: "/exam/results", fallback: null }
    : {
        route: null,
        fallback: {
          score: attempt.score,
          total: attempt.total,
          passed: attempt.passed,
          ...(attempt.variant ? { variant: attempt.variant } : {}),
        },
      };
}

export function createExamSubmissionController() {
  let latest: ExamSnapshot | null = null;
  let submitted = false;

  return {
    update(snapshot: ExamSnapshot) {
      latest = snapshot;
    },
    submit() {
      if (submitted || !latest) {
        return null;
      }
      submitted = true;
      return buildExamAttempt(latest);
    },
    release() {
      submitted = false;
    },
  };
}
