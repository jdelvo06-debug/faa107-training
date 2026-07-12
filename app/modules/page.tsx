import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modules } from "@/lib/course-data";
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((courseModule) => (
          <Card key={courseModule.id} className="flex flex-col">
            <CardHeader>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge variant="amber">Module {courseModule.number}</Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {courseModule.estimatedMinutes} min
                </span>
              </div>
              <CardTitle>{courseModule.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm leading-6 text-muted-foreground">{courseModule.description}</p>
              <Button asChild className="mt-5">
                <Link href={`/modules/${courseModule.id}`}>
                  Open module
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
