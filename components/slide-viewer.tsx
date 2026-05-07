"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Layers, ListChecks, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { addActivity, markSlideVisited } from "@/lib/progress-storage";
import type { Module, SlideContentBlock } from "@/lib/types";

function BlockRenderer({ block }: { block: SlideContentBlock }) {
  if (block.type === "paragraph") {
    return <p className="max-w-3xl text-lg leading-8 text-slate-200">{block.text}</p>;
  }

  if (block.type === "bullets") {
    return (
      <ul className="grid gap-3 text-base leading-7 text-slate-200">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3">
            <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.18em] text-amber-200">{block.title}</p>
        <p className="text-sm leading-6 text-amber-50">{block.text}</p>
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-white/10 text-slate-100">
              <tr>
                {block.headers.map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {block.rows.map((row) => (
                <tr key={row.join("-")}>
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3 text-slate-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (block.type === "diagram") {
    return (
      <div className="rounded-lg border border-sky-300/25 bg-sky-300/10 p-4">
        <p className="mb-4 flex items-center gap-2 font-semibold text-sky-100">
          <Layers className="h-4 w-4" />
          {block.title}
        </p>
        <ol className="grid gap-3">
          {block.items.map((item, index) => (
            <li key={item} className="grid grid-cols-[2rem_1fr] items-start gap-3 text-sm text-slate-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="pt-1.5">{item}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (block.type === "video") {
    return (
      <div className="aspect-video overflow-hidden rounded-lg border border-white/10">
        <iframe title={block.title} src={block.embedUrl} className="h-full w-full" allowFullScreen />
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="overflow-hidden rounded-lg border border-white/10">
        <Image src={block.src} alt={block.alt} width={1200} height={675} className="w-full" />
        {block.caption ? (
          <figcaption className="border-t border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return null;
}

export function SlideViewer({ courseModule }: { courseModule: Module }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = courseModule.slides[index];
  const percent = useMemo(
    () => Math.round(((index + 1) / courseModule.slides.length) * 100),
    [index, courseModule.slides.length]
  );
  const lastVisitedId = useRef<string | null>(null);

  const goToSlide = (nextIndex: number) => {
    setDirection(nextIndex > index ? 1 : -1);
    setIndex(Math.min(courseModule.slides.length - 1, Math.max(0, nextIndex)));
  };

  useEffect(() => {
    if (lastVisitedId.current === slide.id) return;
    lastVisitedId.current = slide.id;

    markSlideVisited(courseModule.id, slide.id, courseModule.slides.length);
    addActivity({
      label: `Viewed Module ${courseModule.number}: ${slide.title}`,
      href: `/modules/${courseModule.id}`
    });
  }, [courseModule.id, courseModule.number, courseModule.slides.length, slide.id, slide.title]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setDirection(1);
        setIndex((current) => Math.min(courseModule.slides.length - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setDirection(-1);
        setIndex((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [courseModule.slides.length]);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant={courseModule.stub ? "outline" : "amber"}>{courseModule.stub ? "Content shell" : "Full lesson"}</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">{courseModule.title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{courseModule.description}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/modules/${courseModule.id}/flashcards`}>
              <RotateCcw className="h-4 w-4" />
              Flashcards
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/modules/${courseModule.id}/quiz`}>
              <ListChecks className="h-4 w-4" />
              Quiz
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-white/10 bg-aviation-panel shadow-cockpit">
        <CardContent className="p-0">
          <div className="border-b border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>
                Slide {index + 1} of {courseModule.slides.length}
              </span>
              <span>{percent}% through module</span>
            </div>
            <Progress value={percent} className="bg-white/10" />
          </div>
          <div className="relative min-h-[540px] overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.article
                key={slide.id}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 36 : -36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -36 : 36 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="min-h-[540px] p-5 sm:p-8"
              >
                {slide.kicker ? (
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">{slide.kicker}</p>
                ) : null}
                <h2 className="mb-6 max-w-4xl text-3xl font-bold leading-tight tracking-normal text-white sm:text-5xl">
                  {slide.title}
                </h2>
                <div className="grid gap-5">{slide.blocks.map((block, blockIndex) => <BlockRenderer key={blockIndex} block={block} />)}</div>
                {slide.sources?.length ? (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {slide.sources.map((source) => (
                      <a
                        key={source.href}
                        href={source.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-sky-100 hover:bg-white/10"
                      >
                        {source.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </motion.article>
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" disabled={index === 0} onClick={() => goToSlide(index - 1)}>
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex flex-wrap justify-center gap-2">
              {courseModule.slides.map((item, slideIndex) => (
                <button
                  key={item.id}
                  aria-label={`Go to slide ${slideIndex + 1}`}
                  onClick={() => goToSlide(slideIndex)}
                  className={`h-2.5 w-8 rounded-full transition-colors ${slideIndex === index ? "bg-primary" : "bg-white/20 hover:bg-white/35"}`}
                />
              ))}
            </div>
            <Button
              disabled={index === courseModule.slides.length - 1}
              onClick={() => goToSlide(index + 1)}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
