import { FlashcardDeck } from "@/components/flashcard-deck";
import { flashcards } from "@/lib/flashcards";

export default function FlashcardsPage() {
  return <FlashcardDeck moduleId="all" title="All Flashcards" cards={flashcards} />;
}
