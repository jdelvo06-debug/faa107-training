"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { modules } from "@/lib/course-data";
import { getModuleCompletion } from "@/lib/progress-selectors";
import { useProgress } from "@/lib/progress-storage";
import { cn } from "@/lib/utils";

const phases = [
  { label: "Foundation", ids: ["1"] },
  { label: "Regs & Airspace", ids: ["2", "3", "4", "5"] },
  { label: "Human & Machine", ids: ["6", "7", "8", "9", "10"] },
  { label: "Test Flight", ids: ["11", "12"] },
  { label: "Beyond the Certificate", ids: ["13"] }
];

export function ModuleNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const progress = useProgress();
  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  return (
    <nav aria-label="Course modules" className="space-y-5">
      {phases.map((phase) => {
        const phaseModules = phase.ids
          .map((id) => moduleMap.get(id)!)
          .filter(Boolean);
        const phaseCompleted = phaseModules.filter(
          (m) => progress.modules[m.id]?.completed
        ).length;

        return (
          <div key={phase.label} className="space-y-1">
            <div className="flex items-center justify-between px-3 pb-0.5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {phase.label}
              </p>
              <p className="text-[0.58rem] tabular-nums text-slate-600">
                {phaseCompleted}/{phaseModules.length}
              </p>
            </div>

            {phaseModules.map((courseModule) => {
              const percent = getModuleCompletion(courseModule.id, progress);
              const active = pathname.startsWith(
                `/modules/${courseModule.id}`
              );
              const completed =
                progress.modules[courseModule.id]?.completed;

              return (
                <Link
                  key={courseModule.id}
                  href={`/modules/${courseModule.id}`}
                  onClick={onNavigate}
                  className={cn(
                    "group grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    "border-l-2",
                    active
                      ? "border-l-primary bg-primary/10 text-white"
                      : "border-l-transparent text-muted-foreground hover:border-l-white/10 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border border-current/20"
                    )}
                  >
                    {courseModule.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {courseModule.title}
                    </span>
                    <span className="block text-xs opacity-75">
                      {courseModule.estimatedMinutes} min
                    </span>
                    {/* Mini progress rail */}
                    {completed ? (
                      <span className="mt-1 block h-[2px] w-full rounded-full bg-primary/50" />
                    ) : percent > 0 ? (
                      <span className="mt-1 block h-[2px] w-full rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full bg-primary/60 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                    ) : null}
                  </span>
                  {completed ? (
                    <CheckCircle2
                      className="h-4 w-4 text-primary"
                      aria-label="Completed"
                    />
                  ) : percent > 0 ? (
                    <Gauge
                      className="h-4 w-4"
                      aria-label="In progress"
                    />
                  ) : (
                    <Circle
                      className="h-4 w-4"
                      aria-label="Not started"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
      <div className="px-3 pt-2">
        <Badge
          variant="outline"
          className="border-sky-300/30 text-sky-100"
        >
          13 modules
        </Badge>
      </div>
    </nav>
  );
}
