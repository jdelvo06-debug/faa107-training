"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, PlaneTakeoff, X } from "lucide-react";
import styles from "./design-lab.module.css";

const links = [
  { href: "/design-lab/landing", label: "Home", key: "home" },
  { href: "/modules", label: "Modules", key: "modules" },
  { href: "/flashcards", label: "Practice", key: "practice" },
  { href: "/design-lab/exam", label: "Exam", key: "exam" },
  { href: "/resources", label: "Resources", key: "resources" },
  { href: "/about", label: "About", key: "about" },
];

export function StudioShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const productionNavigation = [
      ...Array.from(document.querySelectorAll(".app-mobile-header, .app-desktop-sidebar")),
      ...Array.from(document.querySelectorAll(".modern-flight-shell-header")),
    ];
    const previousValues = productionNavigation.map((element) => element.getAttribute("aria-hidden"));
    productionNavigation.forEach((element) => element.setAttribute("aria-hidden", "true"));

    return () => {
      productionNavigation.forEach((element, index) => {
        const previousValue = previousValues[index];
        if (previousValue === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", previousValue);
        }
      });
    };
  }, []);

  return (
    <div className={styles.studioPage}>
      <header className={styles.studioHeader}>
        <div className={styles.studioHeaderInner}>
          <Link href="/design-lab" className={styles.studioBrand} onClick={() => setMenuOpen(false)}>
            <PlaneTakeoff aria-hidden="true" />
            <span>Part 107 Proficiency</span>
          </Link>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={menuOpen}
            aria-controls="studio-navigation"
            aria-label={menuOpen ? "Close design lab navigation" : "Open design lab navigation"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav
            id="studio-navigation"
            aria-label="Design lab navigation"
            className={`${styles.studioNav} ${menuOpen ? styles.studioNavOpen : ""}`}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={active === link.key ? styles.studioNavActive : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/modules/1" className={styles.headerCta}>
            Start learning
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
