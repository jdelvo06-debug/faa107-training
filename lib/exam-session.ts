import type { ExamAttempt, QuizQuestion, TopicArea } from "@/lib/types";

export const ACTIVE_EXAM_VERSION = 1;

export interface ActiveExamSession {
  version: typeof ACTIVE_EXAM_VERSION;
  started: true;
  questionIds: string[];
  answers: Record<string, number>;
  flags: string[];
  currentIndex: number;
  deadlineAt: number;
}

interface ExamSnapshot {
  pool: QuizQuestion[];
  answers: Record<string, number>;
  flags: string[];
}

export interface RestoredExamSession extends ExamSnapshot {
  started: true;
  currentIndex: number;
  secondsLeft: number;
  deadlineAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createActiveExamSession(
  state: {
    questionIds: string[];
    answers: Record<string, number>;
    flags: string[];
    currentIndex: number;
    remainingSeconds: number;
    deadlineAt?: number;
  },
  now = Date.now(),
): ActiveExamSession {
  return {
    version: ACTIVE_EXAM_VERSION,
    started: true,
    questionIds: [...state.questionIds],
    answers: { ...state.answers },
    flags: [...state.flags],
    currentIndex: state.currentIndex,
    deadlineAt: state.deadlineAt ?? now + state.remainingSeconds * 1_000,
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

  const expectedQuestionCount = Math.min(60, questions.length);
  const questionIds = value.questionIds;
  const answers = value.answers;
  const flags = value.flags;
  const currentIndex = value.currentIndex;
  const deadlineAt = value.deadlineAt;

  if (
    value.version !== ACTIVE_EXAM_VERSION ||
    value.started !== true ||
    !Array.isArray(questionIds) ||
    questionIds.length !== expectedQuestionCount ||
    !questionIds.every((id): id is string => typeof id === "string") ||
    new Set(questionIds).size !== questionIds.length ||
    !isRecord(answers) ||
    !Array.isArray(flags) ||
    !flags.every((id): id is string => typeof id === "string") ||
    new Set(flags).size !== flags.length ||
    !Number.isInteger(currentIndex) ||
    (currentIndex as number) < 0 ||
    (currentIndex as number) >= questionIds.length ||
    typeof deadlineAt !== "number" ||
    !Number.isFinite(deadlineAt) ||
    deadlineAt <= now
  ) {
    return null;
  }

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const pool = questionIds.map((id) => questionsById.get(id));
  if (pool.some((question) => !question)) {
    return null;
  }

  const questionIdSet = new Set(questionIds);
  const answerEntries = Object.entries(answers);
  if (
    !answerEntries.every(([id, answer]) => {
      const question = questionsById.get(id);
      return (
        questionIdSet.has(id) &&
        Number.isInteger(answer) &&
        (answer as number) >= 0 &&
        (answer as number) < question!.choices.length
      );
    }) ||
    !flags.every((id) => questionIdSet.has(id))
  ) {
    return null;
  }

  return {
    started: true,
    pool: pool as QuizQuestion[],
    answers: answers as Record<string, number>,
    flags,
    currentIndex: currentIndex as number,
    secondsLeft: Math.ceil((deadlineAt - now) / 1_000),
    deadlineAt,
  };
}

function buildExamAttempt(snapshot: ExamSnapshot): Omit<ExamAttempt, "id" | "completedAt"> {
  const topicScores: Partial<Record<TopicArea, { correct: number; total: number }>> = {};
  let score = 0;

  for (const question of snapshot.pool) {
    const topicScore = topicScores[question.topic] ?? { correct: 0, total: 0 };
    topicScore.total += 1;
    if (snapshot.answers[question.id] === question.correctIndex) {
      topicScore.correct += 1;
      score += 1;
    }
    topicScores[question.topic] = topicScore;
  }

  const total = snapshot.pool.length;
  return {
    score,
    total,
    passed: total > 0 && score / total >= 0.7,
    topicScores,
    flaggedCount: snapshot.flags.length,
  };
}

export interface ExamCompletionFallback {
  score: number;
  total: number;
  passed: boolean;
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
