"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, PlaneTakeoff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./modern-flight-school.module.css";

type AuthMode = "login" | "signup";
const AUTH_RETRY_MESSAGE = "We could not reach the sign-in service. Check your connection and try again.";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
        setMessage("Check your email to confirm your account, then return here to log in.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(AUTH_RETRY_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (oauthError) setError(oauthError.message);
    } catch {
      setError(AUTH_RETRY_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <section className={styles.authCard} aria-labelledby="auth-title">
        <div className={styles.authMark}><PlaneTakeoff aria-hidden="true" /></div>
        <p className={styles.eyebrow}>{isSignup ? "Create your account" : "Pilot sign in"}</p>
        <h1 id="auth-title">{isSignup ? "Keep your training within reach." : "Welcome back to the flight line."}</h1>
        <p className={styles.authIntro}>
          {isSignup
            ? "Create an account for future cross-device progress sync. Your current browser progress stays in place."
            : "Sign in without interrupting the course progress already stored in this browser."}
        </p>

        <form className={styles.authForm} onSubmit={handleEmailAuth}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {isSignup ? (
            <>
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </>
          ) : null}

          <div className={styles.authStatus} aria-live="polite">
            {error ? <p role="alert" className={styles.authError}>{error}</p> : null}
            {message ? <p className={styles.authSuccess}>{message}</p> : null}
          </div>

          <button className={styles.authPrimaryAction} type="submit" disabled={submitting}>
            {submitting ? "Working…" : isSignup ? "Create account" : "Log in"}
            {!submitting ? <ArrowRight aria-hidden="true" /> : null}
          </button>
        </form>

        <div className={styles.authDivider}><span>or</span></div>
        <button className={styles.authGoogleAction} type="button" onClick={handleGoogleSignIn} disabled={submitting}>
          <Mail aria-hidden="true" /> Continue with Google
        </button>

        <p className={styles.authSwitch}>
          {isSignup ? "Already have an account?" : "New to Part 107 Proficiency?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Sign up"}</Link>
        </p>
        <Link href="/dashboard" className={styles.authContinueLink}>Continue training without an account</Link>
      </section>
    </div>
  );
}
