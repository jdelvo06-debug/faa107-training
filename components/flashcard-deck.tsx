"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { addActivity, saveFlashcardProgress, useProgress } from "@/lib/progress-storage";
import { flashcardActivityHref } from "@/lib/learning-routes";
import type { Flashcard } from "@/lib/types";
import styles from "./modern-flight-school.module.css";

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function FlashcardDeck({
  moduleId,
  title,
  cards,
  activityHref
}: {
  moduleId: string;
  title: string;
  cards: Flashcard[];
  activityHref?: string;
}) {
  const progress = useProgress();
  const saved = progress.flashcards[moduleId] ?? { known: [], unknown: [] };
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = deck[index];
  const reviewed = useMemo(() => new Set([...saved.known, ...saved.unknown]).size, [saved.known, saved.unknown]);

  useEffect(() => {
    setDeck(cards);
    setIndex(0);
  }, [cards]);

  if (cards.length === 0) {
    return (
      <Card className={styles.coursePage}>
        <CardHeader>
          <CardTitle>Flashcards coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This deck will be filled as the module content expands.</p>
        </CardContent>
      </Card>
    );
  }

  function mark(cardId: string, known: boolean) {
    const next = {
      known: known ? [...saved.known.filter((id) => id !== cardId), cardId] : saved.known.filter((id) => id !== cardId),
      unknown: known ? saved.unknown.filter((id) => id !== cardId) : [...saved.unknown.filter((id) => id !== cardId), cardId]
    };
    saveFlashcardProgress(moduleId, next);
    addActivity({
      label: `Reviewed flashcard: ${card.front}`,
      href: flashcardActivityHref(moduleId, activityHref)
    });
    setFlipped(false);
    setIndex((current) => (current + 1) % deck.length);
  }

  return (
    <div className={`${styles.coursePage} grid gap-5`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{title}</h1>
          <p className="mt-2 text-muted-foreground">
            {reviewed} of {cards.length} cards reviewed
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setDeck(shuffled(cards));
            setIndex(0);
            setFlipped(false);
          }}
        >
          <Shuffle className="h-4 w-4" />
          Shuffle
        </Button>
      </div>
      <Progress value={Math.round((reviewed / cards.length) * 100)} aria-label="Flashcards review progress" />
      <button
        onClick={() => setFlipped((current) => !current)}
        className="min-h-[360px] rounded-lg border border-white/10 bg-aviation-panel p-6 text-left shadow-cockpit transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          {flipped ? "Back" : "Front"} - card {index + 1} of {deck.length}
        </p>
        <div className="flex min-h-[220px] items-center">
          <p className="text-3xl font-bold leading-tight text-white sm:text-5xl">{flipped ? card.back : card.front}</p>
        </div>
        <p className="text-sm text-slate-400">Tap card to flip</p>
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" className="border-red-300/35 text-red-100 hover:bg-red-300/10" onClick={() => mark(card.id, false)}>
          <X className="h-4 w-4" />
          Need review
        </Button>
        <Button onClick={() => mark(card.id, true)}>
          <Check className="h-4 w-4" />
          Know it
        </Button>
      </div>
    </div>
  );
}
