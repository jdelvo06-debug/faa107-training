"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, PlaneTakeoff, UserRound, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import styles from "./modern-flight-school.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/modules", label: "Modules" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/exam", label: "Exam" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/study-plan", label: "Study Plan" },
  { href: "/cram-sheet", label: "Cram Sheet" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function ModernFlightSchoolShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, loading, signOut } = useAuth();

  function handleSignOut() {
    setAuthError(null);
    void signOut().catch(() => setAuthError("Sign out failed. Please try again."));
  }

  const authControls = (className: string) => (
    <div className={className}>
      {loading ? <span className={styles.authLoading}>Checking account…</span> : user ? (
        <>
          <span className={styles.authUserEmail} title={user.email}><UserRound aria-hidden="true" />{user.email}</span>
          <button type="button" onClick={handleSignOut}><LogOut aria-hidden="true" />Sign out</button>
        </>
      ) : (
        <>
          <Link href="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
          <Link href="/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>
        </>
      )}
    </div>
  );

  return (
    <div className={styles.flightPage}>
      <header className={`${styles.flightHeader} modern-flight-shell-header`} data-modern-flight-header>
        <div className={styles.flightHeaderInner}>
          <Link href="/" className={styles.flightBrand} onClick={() => setMenuOpen(false)}>
            <PlaneTakeoff aria-hidden="true" />
            <span>Part 107 Proficiency</span>
          </Link>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={menuOpen}
            aria-controls="flight-school-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav
            id="flight-school-navigation"
            aria-label="Primary navigation"
            className={`${styles.flightNav} ${menuOpen ? styles.flightNavOpen : ""}`}
          >
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? styles.flightNavActive : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            {authControls(styles.authControlsMobile)}
          </nav>
          <div className={styles.headerActions}>
            {authControls(styles.authControlsDesktop)}
            <Link href="/modules/1" className={styles.headerCta}>Start learning</Link>
          </div>
        </div>
        <p className={styles.navAuthStatus} aria-live="polite">{authError}</p>
      </header>
      <main className={pathname === "/" ? undefined : styles.flightContent}>{children}</main>
    </div>
  );
}
