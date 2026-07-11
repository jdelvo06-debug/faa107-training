import type {
  AssessmentVariant,
  PresentationMetadata,
  PresentationQuestion,
  QuizMode,
  QuizQuestion,
  TopicArea,
} from "@/lib/types";

export const FAA_EXAM_TARGETS: Readonly<Record<TopicArea, number>> = {
  Regulations: 12,
  Airspace: 12,
  Weather: 9,
  "Loading & Performance": 6,
  Operations: 21,
};

export interface DeterministicOptions {
  seed: number;
}

export interface PracticeDrillOptions extends DeterministicOptions {
  count?: number;
}

export interface QuizModePolicy {
  answersMayChange: boolean;
  feedback: "immediate" | "completion";
}

const QUIZ_MODE_POLICIES: Readonly<Record<QuizMode, QuizModePolicy>> = {
  study: {
    answersMayChange: true,
    feedback: "immediate",
  },
  assessment: {
    answersMayChange: false,
    feedback: "completion",
  },
};

export function createSeededRandom(seed: number): () => number {
  if (!Number.isSafeInteger(seed)) {
    throw new Error("Assessment seed must be a safe integer.");
  }

  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function validateQuestion(question: QuizQuestion) {
  if (
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex >= question.choices.length
  ) {
    throw new Error(`Question ${question.id} has an invalid correct answer index.`);
  }
}

function buildPresentation(
  question: QuizQuestion,
  variant: AssessmentVariant,
  seed: number,
  random: () => number,
): PresentationQuestion {
  validateQuestion(question);

  let sourceChoiceIndexes: number[];
  if (variant === "practice_drill") {
    sourceChoiceIndexes = question.choices.map((_, index) => index);
  } else {
    const distractorIndexes = question.choices
      .map((_, index) => index)
      .filter((index) => index !== question.correctIndex);
    if (distractorIndexes.length < 2) {
      throw new Error(
        `Question ${question.id} requires at least two canonical distractors for FAA presentation.`,
      );
    }
    sourceChoiceIndexes = shuffle(distractorIndexes, random).slice(0, 2);
    sourceChoiceIndexes.push(question.correctIndex);
    sourceChoiceIndexes = shuffle(sourceChoiceIndexes, random);
  }

  return restorePresentationQuestion(question, {
    variant,
    seed,
    sourceChoiceIndexes,
  });
}

export function restorePresentationQuestion(
  question: QuizQuestion,
  presentation: PresentationMetadata,
): PresentationQuestion {
  validateQuestion(question);
  const { sourceChoiceIndexes } = presentation;
  const expectedChoiceCount = presentation.variant === "faa_timed" ? 3 : question.choices.length;

  if (
    sourceChoiceIndexes.length !== expectedChoiceCount ||
    new Set(sourceChoiceIndexes).size !== sourceChoiceIndexes.length ||
    !sourceChoiceIndexes.every(
      (index) => Number.isInteger(index) && index >= 0 && index < question.choices.length,
    ) ||
    !sourceChoiceIndexes.includes(question.correctIndex)
  ) {
    throw new Error(`Question ${question.id} has invalid presentation metadata.`);
  }

  return {
    sourceQuestionId: question.id,
    prompt: question.prompt,
    choices: sourceChoiceIndexes.map((index) => question.choices[index]),
    correctIndex: sourceChoiceIndexes.indexOf(question.correctIndex),
    topic: question.topic,
    explanation: question.explanation,
    presentation: {
      variant: presentation.variant,
      seed: presentation.seed,
      sourceChoiceIndexes: [...sourceChoiceIndexes],
    },
  };
}

export function presentQuestion(
  question: QuizQuestion,
  variant: AssessmentVariant,
  options: DeterministicOptions,
): PresentationQuestion {
  return buildPresentation(
    question,
    variant,
    options.seed,
    createSeededRandom(options.seed),
  );
}

export function buildFaaTimedExam(
  pool: readonly QuizQuestion[],
  options: DeterministicOptions,
): PresentationQuestion[] {
  const random = createSeededRandom(options.seed);
  const seenIds = new Set<string>();
  const uniquePool = pool.filter((question) => {
    if (seenIds.has(question.id)) {
      return false;
    }
    seenIds.add(question.id);
    return true;
  });

  const selected = (Object.entries(FAA_EXAM_TARGETS) as [TopicArea, number][])
    .flatMap(([topic, target]) => {
      const candidates = uniquePool.filter((question) => question.topic === topic);
      if (candidates.length < target) {
        throw new Error(
          `${topic} requires ${target} unique questions; received ${candidates.length}.`,
        );
      }
      return shuffle(candidates, random).slice(0, target);
    });

  return shuffle(selected, random).map((question) =>
    buildPresentation(question, "faa_timed", options.seed, random),
  );
}

export function buildPracticeDrill(
  pool: readonly QuizQuestion[],
  options: PracticeDrillOptions,
): PresentationQuestion[] {
  const random = createSeededRandom(options.seed);
  const seenIds = new Set<string>();
  const uniquePool = pool.filter((question) => {
    if (seenIds.has(question.id)) {
      return false;
    }
    seenIds.add(question.id);
    return true;
  });
  const count = Math.min(options.count ?? 60, uniquePool.length);

  return shuffle(uniquePool, random)
    .slice(0, count)
    .map((question) =>
      buildPresentation(question, "practice_drill", options.seed, random),
    );
}

export function getQuizModePolicy(mode: QuizMode): QuizModePolicy {
  return { ...QUIZ_MODE_POLICIES[mode] };
}

export function applyQuizAnswer(
  mode: QuizMode,
  currentAnswer: number | undefined,
  nextAnswer: number,
): number {
  if (mode === "assessment" && currentAnswer !== undefined) {
    return currentAnswer;
  }
  return nextAnswer;
}
