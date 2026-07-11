import type { Metadata } from "next";
import { PracticeExam } from "@/components/practice-exam";
import { examQuestions } from "@/lib/questions";

export const metadata: Metadata = {
  title: "FAA Part 107 Practice Exam",
  description: "Take a timed FAA Part 107 practice exam and review your performance by knowledge area.",
};

export default function ExamPage() {
  return <PracticeExam questions={examQuestions} />;
}
