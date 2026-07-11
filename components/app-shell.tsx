"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Clock, FileText, Gauge, GraduationCap, Library, Menu, Plane, Trophy, HelpCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ModuleNav } from "@/components/module-nav";
import { cn } from "@/lib/utils";
import { useState } from "react";

const primaryLinks = [
  { href: "/", label: "Home", icon: Plane },
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/flashcards", label: "Flashcards", icon: Library },
  { href: "/exam", label: "Exam", icon: Trophy },
  { href: "/study-plan", label: "Study Plan", icon: Clock },
  { href: "/cram-sheet", label: "Cram Sheet", icon: FileText },
  { href: "/resources", label: "Resources", icon: HelpCircle },
  { href: "/about", label: "About", icon: Info }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navContent = (
    <div className="flex h-full flex-col">
      <Link href="/" className="mb-6 flex items-center gap-3" onClick={() => setOpen(false)}>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold">Part 107 Proficiency</p>
          <p className="text-xs text-muted-foreground">Remote pilot study deck</p>
        </div>
      </Link>
      <div className="mb-6 grid gap-1">
        {primaryLinks.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="mb-3 flex items-center justify-between px-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Course</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ModuleNav onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="app-desktop-sidebar fixed inset-y-0 left-0 z-30 hidden w-80 border-r border-white/10 bg-aviation-navy/95 p-5 lg:block">
        {navContent}
      </aside>
      <header className="app-mobile-header sticky top-0 z-20 border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Plane className="h-5 w-5 text-primary" />
            Part 107
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {navContent}
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="lg:pl-80">
        <div className="app-main-content mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
