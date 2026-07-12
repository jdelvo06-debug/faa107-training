import Link from "next/link";
import styles from "@/components/modern-flight-school.module.css";

export default function AuthCodeErrorPage() {
  return (
    <div className={styles.authPage}>
      <section className={styles.authCard} aria-labelledby="auth-error-title">
        <p className={styles.eyebrow}>Authentication</p>
        <h1 id="auth-error-title">We could not complete sign in.</h1>
        <p>The sign-in link may have expired or the provider may have canceled the request.</p>
        <Link href="/login" className={styles.authPrimaryAction}>Return to login</Link>
      </section>
    </div>
  );
}
