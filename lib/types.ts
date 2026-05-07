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
}

export interface ExamAttempt {
  id: string;
  score: number;
  total: number;
  passed: boolean;
  topicScores: Partial<Record<TopicArea, { correct: number; total: number }>>;
  completedAt: string;
  flaggedCount: number;
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
}

export interface FlashcardProgress {
  known: string[];
  unknown: string[];
}

export interface ProgressState {
  version: 1;
  modules: Record<string, ModuleProgress>;
  quizAttempts: QuizAttempt[];
  flashcards: Record<string, FlashcardProgress>;
  examAttempts: ExamAttempt[];
  recentActivity: RecentActivity[];
}
