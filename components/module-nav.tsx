"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { modules } from "@/lib/course-data";
import { getModuleCompletion } from "@/lib/progress-selectors";
import { useProgress } from "@/lib/progress-storage";
import { cn } from "@/lib/utils";

export function ModuleNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const progress = useProgress();

  return (
    <nav aria-label="Course modules" className="space-y-2">
      {modules.map((courseModule) => {
        const percent = getModuleCompletion(courseModule.id, progress);
        const active = pathname.startsWith(`/modules/${courseModule.id}`);
        const completed = progress.modules[courseModule.id]?.completed;
        return (
          <Link
            key={courseModule.id}
            href={`/modules/${courseModule.id}`}
            onClick={onNavigate}
            className={cn(
              "group grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-current/20 text-xs font-bold">
              {courseModule.number}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{courseModule.title}</span>
              <span className="block text-xs opacity-75">{courseModule.estimatedMinutes} min</span>
            </span>
            {completed ? (
              <CheckCircle2 className="h-4 w-4" aria-label="Completed" />
            ) : percent > 0 ? (
              <Gauge className="h-4 w-4" aria-label="In progress" />
            ) : (
              <Circle className="h-4 w-4" aria-label="Not started" />
            )}
          </Link>
        );
      })}
      <div className="px-3 pt-2">
        <Badge variant="outline" className="border-sky-300/30 text-sky-100">
          13 modules
        </Badge>
      </div>
    </nav>
  );
}
