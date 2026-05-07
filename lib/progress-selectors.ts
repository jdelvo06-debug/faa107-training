import { flashcards } from "@/lib/flashcards";
import { modules } from "@/lib/course-data";
import type { ProgressState, TopicArea } from "@/lib/types";

export function getModuleCompletion(moduleId: string, progress: ProgressState) {
  const courseModule = modules.find((item) => item.id === moduleId);
  const moduleProgress = progress.modules[moduleId];
  if (!courseModule || !moduleProgress) {
    return 0;
  }

  return Math.round((moduleProgress.visitedSlideIds.length / courseModule.slides.length) * 100);
}

export function getOverallProgress(progress: ProgressState) {
  const totalSlides = modules.reduce((total, courseModule) => total + courseModule.slides.length, 0);
  const visitedSlides = modules.reduce((total, courseModule) => {
    return total + (progress.modules[courseModule.id]?.visitedSlideIds.length ?? 0);
  }, 0);

  return totalSlides === 0 ? 0 : Math.round((visitedSlides / totalSlides) * 100);
}

export function getContinueTarget(progress: ProgressState) {
  const activity = progress.recentActivity.find((item) => item.href.startsWith("/modules/"));
  if (activity) {
    return activity;
  }

  const firstIncomplete = modules.find((courseModule) => !progress.modules[courseModule.id]?.completed);
  return {
    label: firstIncomplete ? `Start Module ${firstIncomplete.number}` : "Review Module 1",
    href: firstIncomplete ? `/modules/${firstIncomplete.id}` : "/modules/1"
  };
}

export function getWeakAreas(progress: ProgressState) {
  const totals: Partial<Record<TopicArea, { correct: number; total: number }>> = {};

  for (const attempt of [...progress.quizAttempts, ...progress.examAttempts]) {
    for (const [topic, score] of Object.entries(attempt.topicScores) as [
      TopicArea,
      { correct: number; total: number }
    ][]) {
      totals[topic] = {
        correct: (totals[topic]?.correct ?? 0) + score.correct,
        total: (totals[topic]?.total ?? 0) + score.total
      };
    }
  }

  return Object.entries(totals)
    .map(([topic, score]) => ({
      topic: topic as TopicArea,
      percent: score.total ? Math.round((score.correct / score.total) * 100) : 0
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);
}

export function getFlashcardTotals(progress: ProgressState) {
  const known = Object.values(progress.flashcards).reduce((total, deck) => total + deck.known.length, 0);
  const unknown = Object.values(progress.flashcards).reduce((total, deck) => total + deck.unknown.length, 0);
  return {
    total: flashcards.length,
    reviewed: known + unknown,
    known,
    unknown
  };
}
