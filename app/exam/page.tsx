import { PracticeExam } from "@/components/practice-exam";
import { examQuestions } from "@/lib/questions";

export default function ExamPage() {
  return <PracticeExam questions={examQuestions} />;
}
