"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PlaneTakeoff, X } from "lucide-react";
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
          </nav>
          <Link href="/modules/1" className={styles.headerCta}>Start learning</Link>
        </div>
      </header>
      <main className={pathname === "/" ? undefined : styles.flightContent}>{children}</main>
    </div>
  );
}
