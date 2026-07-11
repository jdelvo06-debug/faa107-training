import type { Metadata } from "next";
import { StudyPlan } from "@/components/study-plan";

export const metadata: Metadata = {
  title: "FAA Part 107 Study Plan",
  description: "Choose a structured 7-day or 14-day FAA Part 107 study plan and track your module progress.",
};

export default function StudyPlanPage() {
  return <StudyPlan />;
}
