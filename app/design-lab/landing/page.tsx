import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckSquare, Clock3, Layers3, RefreshCcw, Target } from "lucide-react";
import { courseModuleMetadata as modules } from "@/lib/course-metadata";
import { StudioShell } from "../studio-shell";
import heroImage from "../assets/modern-flight-school-hero.png";
import styles from "../design-lab.module.css";

const path = [
  { title: "Learn", description: "Clear lessons build knowledge from the ground up.", icon: BookOpen },
  { title: "Practice", description: "Quizzes and flashcards make key rules stick.", icon: CheckSquare },
  { title: "Test", description: "Timed practice builds calm test-day readiness.", icon: Target },
  { title: "Review", description: "Weak-area guidance keeps the next step clear.", icon: RefreshCcw },
];

export default function LandingPrototypePage() {
  return (
    <StudioShell active="home">
      <div>
        <section className={styles.landingHero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Remote pilot study</p>
            <h1>Part 107<br />Proficiency</h1>
            <p className={styles.heroStatement}>Clear lessons. Confident decisions.<br />Ready for test day.</p>
            <div className={styles.heroActions}>
              <Link href="/modules/1" className={styles.primaryAction}>
                Start learning <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/design-lab/dashboard" className={styles.secondaryAction}>
                View dashboard <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className={styles.heroImageWrap}>
            <Image
              src={heroImage}
              alt="Camera drone flying above a sunlit mountain valley"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
              className={styles.heroImage}
            />
          </div>
        </section>

        <section className={styles.learningPath} aria-labelledby="learning-path-title">
          <h2 id="learning-path-title" className={styles.srOnly}>Your learning path</h2>
          {path.map(({ title, description, icon: Icon }, index) => (
            <div className={styles.pathStep} key={title}>
              <div className={styles.pathIcon}><Icon aria-hidden="true" /></div>
              <div>
                <p className={styles.pathIndex}>0{index + 1}</p>
                <h3>{title}</h3>
                <p>{description}</p>
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
    </StudioShell>
  );
}
