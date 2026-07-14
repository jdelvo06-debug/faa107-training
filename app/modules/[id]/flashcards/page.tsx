import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { Button } from "@/components/ui/button";
import { courseModuleMetadata as modules, getCourseModuleMetadata } from "@/lib/course-metadata";
import { getFlashcardsForModule } from "@/lib/flashcards";

export function generateStaticParams() {
  return modules.map((courseModule) => ({ id: courseModule.id }));
}

export default async function ModuleFlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseModule = getCourseModuleMetadata(id);
  if (!courseModule) {
    notFound();
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Module {courseModule.number} Flashcards</h1>
          <p className="mt-2 text-muted-foreground">{courseModule.title}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/modules/${courseModule.id}`}>Back to slides</Link>
        </Button>
      </div>
      <FlashcardDeck moduleId={courseModule.id} title={courseModule.title} cards={getFlashcardsForModule(courseModule.id)} />
    </div>
  );
}
