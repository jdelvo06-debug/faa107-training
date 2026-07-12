import Link from "next/link";
import { ArrowRight, ClipboardCheck, Gauge, Sparkles } from "lucide-react";
import { StudioShell } from "./studio-shell";
import styles from "./design-lab.module.css";

const prototypes = [
  {
    href: "/design-lab/landing",
    title: "Landing page",
    description: "Warm, welcoming course entry with a photographic hero and a simple learning path.",
    icon: Sparkles,
  },
  {
    href: "/design-lab/dashboard",
    title: "Dashboard",
    description: "A next-action-first learner home that preserves real local progress and weak-area guidance.",
    icon: Gauge,
  },
  {
    href: "/design-lab/exam",
    title: "Exam experience",
    description: "A calm test room with clearer status, answer selection, flagging, and review controls.",
    icon: ClipboardCheck,
  },
];

export default function DesignLabPage() {
  return (
    <StudioShell>
      <div className={styles.galleryMain}>
        <div className={styles.galleryIntro}>
          <p className={styles.eyebrow}>Selected direction · Modern Flight School</p>
          <h1>Three prototypes. One warmer learning system.</h1>
          <p>
            These pages explore the approved landing, dashboard, and assessment directions without changing the
            production experience.
          </p>
        </div>
        <div className={styles.prototypeList}>
          {prototypes.map(({ href, title, description, icon: Icon }, index) => (
            <Link href={href} key={href} className={styles.prototypeRow}>
              <span className={styles.prototypeNumber}>0{index + 1}</span>
              <span className={styles.prototypeIcon}><Icon aria-hidden="true" /></span>
              <span className={styles.prototypeCopy}>
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </StudioShell>
  );
}
