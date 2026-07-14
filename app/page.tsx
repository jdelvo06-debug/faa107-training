import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckSquare2, Clock3, Layers3, RotateCw, Target } from "lucide-react";
import { courseModuleMetadata as modules } from "@/lib/course-metadata";
import heroImage from "@/app/design-lab/assets/modern-flight-school-hero.png";
import styles from "@/components/modern-flight-school.module.css";

export const metadata: Metadata = {
  title: "Part 107 Proficiency — FAA Remote Pilot Training",
  description: "Clear lessons, focused practice, and timed assessments for the FAA Part 107 remote pilot knowledge test.",
};

const learningPath = [
  { title: "Learn", copy: "Clear lessons build knowledge from the ground up.", icon: BookOpen },
  { title: "Practice", copy: "Quizzes and flashcards make key rules stick.", icon: CheckSquare2 },
  { title: "Test", copy: "Timed practice builds calm test-day readiness.", icon: Target },
  { title: "Review", copy: "Weak-area guidance keeps the next step clear.", icon: RotateCw },
];

export default function LandingPage() {
  return (
    <div>
      <section className={styles.landingHero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Remote pilot study</p>
          <h1><span>Part 107</span><span>Proficiency</span></h1>
          <p className={styles.heroStatement}>
            <span>Clear lessons. Confident decisions.</span>
            <span>Ready for test day.</span>
          </p>
          <div className={styles.heroActions}>
            <Link href="/modules/1" className={styles.primaryAction}>Start learning <ArrowRight aria-hidden="true" /></Link>
            <Link href="/dashboard" className={styles.secondaryAction}>View dashboard <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
        <div className={styles.heroImageWrap}>
          <Image
            src={heroImage}
            alt="Camera drone flying above a sunlit mountain valley"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 58vw"
            className={styles.heroImage}
          />
        </div>
      </section>

      <section className={styles.learningPath} aria-labelledby="learning-path-title">
        <h2 id="learning-path-title" className={styles.srOnly}>Your learning path</h2>
        {learningPath.map(({ title, copy, icon: Icon }, index) => (
          <div className={styles.pathStep} key={title}>
            <div className={styles.pathIcon}><Icon aria-hidden="true" /></div>
            <div>
              <p className={styles.pathIndex}>{String(index + 1).padStart(2, "0")}</p>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.factBand} aria-label="Course facts">
        <div><Layers3 aria-hidden="true" /><p><strong>{modules.length}</strong> modules</p></div>
        <div><Clock3 aria-hidden="true" /><p><strong>120</strong>-minute exam</p></div>
        <div><Target aria-hidden="true" /><p><strong>70%</strong> passing score</p></div>
      </section>
    </div>
  );
}
