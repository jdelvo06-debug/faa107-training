import { flashcards } from "@/lib/flashcards";
import { courseModuleMetadata as modules } from "@/lib/course-metadata";
import type { ProgressState, TopicArea } from "@/lib/types";

export function getModuleCompletion(moduleId: string, progress: ProgressState) {
  const courseModule = modules.find((item) => item.id === moduleId);
  const moduleProgress = progress.modules[moduleId];
  if (!courseModule || !moduleProgress) {
    return 0;
  }

  return Math.round((moduleProgress.visitedSlideIds.length / courseModule.slideIds.length) * 100);
}

export function getOverallProgress(progress: ProgressState) {
  const totalSlides = modules.reduce((total, courseModule) => total + courseModule.slideIds.length, 0);
  const visitedSlides = modules.reduce((total, courseModule) => {
    return total + (progress.modules[courseModule.id]?.visitedSlideIds.length ?? 0);
  }, 0);

  return totalSlides === 0 ? 0 : Math.round((visitedSlides / totalSlides) * 100);
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

export function getResumeTarget(progress: ProgressState) {
  const lastModuleActivity = progress.recentActivity.find((item) => item.href.startsWith("/modules/"));

  if (lastModuleActivity) {
    const match = lastModuleActivity.href.match(/\/modules\/([^\/]+)$/);
    const moduleId = match ? match[1] : null;
    const courseModule = moduleId ? modules.find((m) => m.id === moduleId) : null;

    if (courseModule) {
      const moduleProgress = progress.modules[courseModule.id];
      if (moduleProgress?.lastSlideId) {
        const slideIndex = courseModule.slideIds.indexOf(moduleProgress.lastSlideId);
        const slideNumber = slideIndex !== -1 ? slideIndex + 1 : 1;
        return {
          label: `Resume Module ${courseModule.number}, slide ${slideNumber}`,
          href: `/modules/${courseModule.id}`
        };
      }
      return {
        label: `Resume Module ${courseModule.number}`,
        href: `/modules/${courseModule.id}`
      };
    }
  }

  // Fallback to first incomplete module
  const firstIncomplete = modules.find((courseModule) => !progress.modules[courseModule.id]?.completed);
  if (firstIncomplete) {
    const moduleProgress = progress.modules[firstIncomplete.id];
    if (moduleProgress?.lastSlideId) {
      const slideIndex = firstIncomplete.slideIds.indexOf(moduleProgress.lastSlideId);
      const slideNumber = slideIndex !== -1 ? slideIndex + 1 : 1;
      return {
        label: `Resume Module ${firstIncomplete.number}, slide ${slideNumber}`,
        href: `/modules/${firstIncomplete.id}`
      };
    }
    return {
      label: `Start Module ${firstIncomplete.number}`,
      href: `/modules/${firstIncomplete.id}`
    };
  }

  // If everything is complete, review Module 1
  return {
    label: "Review Module 1",
    href: "/modules/1"
  };
}

export function getTopicModuleHref(topic: TopicArea): string {
  switch (topic) {
    case "Regulations":
      return "/modules/2";
    case "Airspace":
      return "/modules/3";
    case "Weather":
      return "/modules/6";
    case "Loading & Performance":
      return "/modules/7";
    case "Operations":
      return "/modules/7";
    default:
      return "/modules";
  }
}

export function findRecommendedDay(
  plan: { day: number; modules: number[] }[],
  modulesProgress: Record<string, { completed: boolean }>
): number | null {
  for (const day of plan) {
    const hasIncomplete = day.modules.some(m => !modulesProgress[String(m)]?.completed);
    if (hasIncomplete) {
      return day.day;
    }
  }
  return null;
}
