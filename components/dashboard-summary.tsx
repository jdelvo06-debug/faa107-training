"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CircleAlert, Clock3, Layers3, RotateCcw, Target } from "lucide-react";
import { modules } from "@/lib/course-data";
import { getFlashcardTotals, getOverallProgress, getResumeTarget, getTopicModuleHref, getWeakAreas } from "@/lib/progress-selectors";
import { resetProgress, useProgress } from "@/lib/progress-storage";
import styles from "./modern-flight-school.module.css";

export function DashboardSummary() {
  const progress = useProgress();
  const overall = getOverallProgress(progress);
  const target = getResumeTarget(progress);
  const weakAreas = getWeakAreas(progress);
  const flashcardTotals = getFlashcardTotals(progress);
  const completedModules = modules.filter((courseModule) => progress.modules[courseModule.id]?.completed).length;
  const latestExam = progress.examAttempts[0];

  return (
    <div className={styles.dashboardMain}>
      <section className={styles.dashboardIntro}>
        <div>
          <p className={styles.eyebrow}>Your learning dashboard</p>
          <h1>Welcome back, pilot.</h1>
          <p>Pick up where you left off, then use weak-area guidance to decide what deserves attention next.</p>
        </div>
        <div className={styles.progressSeal} aria-label={`Overall course progress: ${overall}%`}>
          <strong>{overall}%</strong><span>course progress</span>
        </div>
      </section>

      <section className={styles.resumeBand}>
        <div>
          <p className={styles.resumeLabel}>Next best action</p>
          <h2>{target.label}</h2>
          <p>Continue your current learning path before switching to another study mode.</p>
        </div>
        <Link href={target.href} className={styles.resumeAction}>Continue learning <ArrowRight aria-hidden="true" /></Link>
      </section>

      <section className={styles.dashboardFacts} aria-label="Progress summary">
        <div><Layers3 aria-hidden="true" /><span>Modules complete</span><strong>{completedModules}/{modules.length}</strong></div>
        <div><BookOpen aria-hidden="true" /><span>Flashcards reviewed</span><strong>{flashcardTotals.reviewed}/{flashcardTotals.total}</strong></div>
        <div><Target aria-hidden="true" /><span>Latest assessment</span><strong>{latestExam ? `${latestExam.score}/${latestExam.total}` : "Not taken"}</strong></div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.guidancePanel} aria-labelledby="weak-area-title">
          <div className={styles.sectionHeading}>
            <div><CircleAlert aria-hidden="true" /><h2 id="weak-area-title">What to review next</h2></div>
            <Link href="/exam">Take an assessment</Link>
          </div>
          {weakAreas.length ? (
            <div className={styles.guidanceList}>
              {weakAreas.map((area) => (
                <Link key={area.topic} href={getTopicModuleHref(area.topic)}>
                  <span>{area.topic}</span><strong>{area.percent}%</strong><ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyGuidance}>
              <Target aria-hidden="true" />
              <div><h3>Build your first recommendation</h3><p>Complete a quiz or exam to reveal the topics that deserve another pass.</p></div>
            </div>
          )}
        </section>

        <section className={styles.activityPanel} aria-labelledby="activity-title">
          <div className={styles.sectionHeading}>
            <div><Clock3 aria-hidden="true" /><h2 id="activity-title">Recent activity</h2></div>
          </div>
          {progress.recentActivity.length ? (
            <div className={styles.activityList}>
              {progress.recentActivity.slice(0, 4).map((activity) => (
                <Link key={activity.id} href={activity.href}>{activity.label}<ArrowRight aria-hidden="true" /></Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyActivity}>Open a lesson, quiz, or flashcard deck to begin your activity trail.</p>
          )}
          <button type="button" className={styles.resetButton} onClick={resetProgress}><RotateCcw aria-hidden="true" /> Reset progress</button>
        </section>
      </div>
    </div>
  );
}
