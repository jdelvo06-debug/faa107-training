"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleAlert, Clock3, Layers3, Target } from "lucide-react";
import { getProgress } from "@/lib/progress-storage";
import {
  getFlashcardTotals,
  getOverallProgress,
  getResumeTarget,
  getTopicModuleHref,
  getWeakAreas,
} from "@/lib/progress-selectors";
import type { ProgressState } from "@/lib/types";
import styles from "../design-lab.module.css";

export function DashboardPrototype() {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const summary = useMemo(() => {
    if (!progress) return null;
    return {
      overall: getOverallProgress(progress),
      flashcards: getFlashcardTotals(progress),
      weakAreas: getWeakAreas(progress),
      resume: getResumeTarget(progress),
      completed: Object.values(progress.modules).filter((item) => item.completed).length,
    };
  }, [progress]);

  if (!progress || !summary) {
    return <div className={styles.dashboardMain}><p role="status">Loading your local progress…</p></div>;
  }

  return (
    <div className={styles.dashboardMain}>
      <section className={styles.dashboardIntro}>
        <div>
          <p className={styles.eyebrow}>Your learning dashboard</p>
          <h1>Welcome back, pilot.</h1>
          <p>Pick up where you left off, then use weak-area guidance to decide what deserves attention next.</p>
        </div>
        <div className={styles.progressSeal} aria-label={`Overall course progress: ${summary.overall}%`}>
          <strong>{summary.overall}%</strong>
          <span>course progress</span>
        </div>
      </section>

      <section className={styles.resumeBand}>
        <div>
          <p className={styles.resumeLabel}>Next best action</p>
          <h2>{summary.resume.label}</h2>
          <p>Continue the current lesson before moving on to another study mode.</p>
        </div>
        <Link href={summary.resume.href} className={styles.resumeAction}>
          Continue learning <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section className={styles.dashboardFacts} aria-label="Progress summary">
        <div><Layers3 aria-hidden="true" /><span>Modules complete</span><strong>{summary.completed}/13</strong></div>
        <div><BookOpen aria-hidden="true" /><span>Flashcards reviewed</span><strong>{summary.flashcards.reviewed}/{summary.flashcards.total}</strong></div>
        <div><Target aria-hidden="true" /><span>Latest assessment</span><strong>{progress.examAttempts[0] ? `${progress.examAttempts[0].score}/${progress.examAttempts[0].total}` : "Not taken"}</strong></div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.guidancePanel} aria-labelledby="weak-area-title">
          <div className={styles.sectionHeading}>
            <div><CircleAlert aria-hidden="true" /><h2 id="weak-area-title">What to review next</h2></div>
            <Link href="/exam">Take an assessment</Link>
          </div>
          {summary.weakAreas.length ? (
            <div className={styles.guidanceList}>
              {summary.weakAreas.map((area) => (
                <Link href={getTopicModuleHref(area.topic)} key={area.topic}>
                  <span>{area.topic}</span><strong>{area.percent}%</strong><ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyGuidance}>
              <Target aria-hidden="true" />
              <div><h3>Build your first recommendation</h3><p>Complete a quiz or practice exam to reveal the topics that need another pass.</p></div>
            </div>
          )}
        </section>

        <section className={styles.sessionPanel} aria-labelledby="session-title">
          <div className={styles.sectionHeading}>
            <div><Clock3 aria-hidden="true" /><h2 id="session-title">A focused session</h2></div>
          </div>
          <ol>
            <li><span>10 min</span><p>Resume your latest lesson</p></li>
            <li><span>08 min</span><p>Review related flashcards</p></li>
            <li><span>12 min</span><p>Finish with a knowledge check</p></li>
          </ol>
          <Link href="/study-plan" className={styles.textAction}>Open full study plan <ArrowRight aria-hidden="true" /></Link>
        </section>
      </div>
    </div>
  );
}
