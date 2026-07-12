export type TopicArea =
  | "Regulations"
  | "Airspace"
  | "Weather"
  | "Loading & Performance"
  | "Operations";

export type SlideContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "bullets";
      items: string[];
    }
  | {
      type: "callout";
      title: string;
      text: string;
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | {
      type: "diagram";
      title: string;
      items: string[];
    }
  | {
      type: "video";
      title: string;
      embedUrl: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
    };

export interface SourceLink {
  label: string;
  href: string;
}

export interface Slide {
  id: string;
  title: string;
  kicker?: string;
  takeaway?: string;
  blocks: SlideContentBlock[];
  sources?: SourceLink[];
}

export interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  topicArea: TopicArea;
  slides: Slide[];
  stub?: boolean;
}

export interface QuizQuestion {
  id: string;
  moduleId?: string;
  topic: TopicArea;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export type QuizMode = "study" | "assessment";

export type AssessmentVariant = "faa_timed" | "practice_drill";
export type ExamVariant = AssessmentVariant | "legacy_timed";

export interface PresentationMetadata {
  variant: AssessmentVariant;
  seed: number;
  sourceChoiceIndexes: number[];
}

export interface PresentationQuestion {
  sourceQuestionId: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  topic: TopicArea;
  explanation: string;
  presentation: PresentationMetadata;
}

export interface Flashcard {
  id: string;
  moduleId: string;
  front: string;
  back: string;
  topic: TopicArea;
}

export interface QuizAttempt {
  id: string;
  moduleId: string;
  score: number;
  total: number;
  topicScores: Partial<Record<TopicArea, { correct: number; total: number }>>;
  completedAt: string;
  mode?: QuizMode;
}

export interface ExamReviewItem {
  questionNumber: number;
  sourceQuestionId: string;
  prompt: string;
  topic: TopicArea;
  selectedAnswer: string | null;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
  flagged: boolean;
}

export interface ExamAttempt {
  id: string;
  score: number;
  total: number;
  passed: boolean;
  topicScores: Partial<Record<TopicArea, { correct: number; total: number }>>;
  completedAt: string;
  flaggedCount: number;
  variant?: ExamVariant;
  review?: ExamReviewItem[];
}

export interface RecentActivity {
  id: string;
  label: string;
  href: string;
  at: string;
}

export interface ModuleProgress {
  visitedSlideIds: string[];
  completed: boolean;
  lastSlideId?: string;
  updatedAt?: string;
}

export interface FlashcardProgress {
  known: string[];
  unknown: string[];
  reviewedAt?: Record<string, string>;
}

export interface ProgressState {
  version: 1;
  modules: Record<string, ModuleProgress>;
  quizAttempts: QuizAttempt[];
  flashcards: Record<string, FlashcardProgress>;
  examAttempts: ExamAttempt[];
  recentActivity: RecentActivity[];
}

export interface AuthenticatedProgressCacheEnvelope {
  envelopeVersion: 1;
  progress: ProgressState;
  resetGeneration: string | null;
  resetEpoch: string | null;
  revision: string | null;
  baseProgress: ProgressState | null;
}

export interface ProgressUnsyncedMarker {
  dirty: true;
  resetGeneration: string | null;
  lastAttemptAt: string | null;
}

export interface AnonymousImportClaim {
  ownerUserId: string;
  state: "pending" | "complete";
  snapshotHash: string;
  snapshot?: ProgressState;
}

export type NormalizeResult =
  | { status: "ok"; progress: ProgressState }
  | { status: "unsupported"; version: number; raw: unknown }
  | { status: "invalid"; reason: string; raw: unknown };

export interface ProgressDelta {
  base: ProgressState;
  proposed: ProgressState;
}

export type ProgressRpcStatus =
  | "current"
  | "committed"
  | "revision_conflict"
  | "first_row_race"
  | "pre_generation_rejected"
  | "generation_mismatch"
  | "duplicate";

export interface ProgressRpcResult {
  status: ProgressRpcStatus;
  progress: ProgressState;
  revision: string;
  resetGeneration: string;
  resetEpoch: string;
}
