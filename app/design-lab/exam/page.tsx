import { examQuestions } from "@/lib/questions";
import { StudioShell } from "../studio-shell";
import { ExamPrototype } from "./exam-prototype";

export default function ExamPrototypePage() {
  return (
    <StudioShell active="exam">
      <ExamPrototype questions={examQuestions.slice(0, 8)} />
    </StudioShell>
  );
}
