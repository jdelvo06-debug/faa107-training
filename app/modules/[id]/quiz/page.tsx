import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizEngine } from "@/components/quiz-engine";
import { Button } from "@/components/ui/button";
import { getModule, modules } from "@/lib/course-data";
import { getQuestionsForModule } from "@/lib/questions";

export function generateStaticParams() {
  return modules.map((courseModule) => ({ id: courseModule.id }));
}

export default function ModuleQuizPage({ params }: { params: { id: string } }) {
  const courseModule = getModule(params.id);
  if (!courseModule) {
    notFound();
  }

  const questions = getQuestionsForModule(courseModule.id);
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Module {courseModule.number} Knowledge Check</h1>
          <p className="mt-2 text-muted-foreground">{courseModule.title}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/modules/${courseModule.id}`}>Back to slides</Link>
        </Button>
      </div>
      <QuizEngine moduleId={courseModule.id} moduleTitle={courseModule.title} questions={questions} />
    </div>
  );
}
