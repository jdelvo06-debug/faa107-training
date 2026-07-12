import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ModuleCardGrid } from "@/components/module-card-grid";
import styles from "@/components/modern-flight-school.module.css";

export const metadata: Metadata = {
  title: "FAA Part 107 Course Modules",
  description: "Explore 13 structured FAA Part 107 course modules with lessons, quizzes, and flashcards.",
};

export default function ModulesPage() {
  return (
    <div className={`${styles.coursePage} grid gap-6`}>
      <div>
        <Badge variant="sky">13-module path</Badge>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">Course modules</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          All 13 modules are fully built with slides, quizzes, and flashcards. Start from Module 1 or jump to any topic.
        </p>
      </div>
      <ModuleCardGrid />
    </div>
  );
}
