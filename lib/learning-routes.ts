export function moduleHref(moduleNumber: number) {
  return `/modules/${moduleNumber}`;
}

export function flashcardActivityHref(moduleId: string, activityHref?: string) {
  return activityHref ?? `/modules/${moduleId}/flashcards`;
}
