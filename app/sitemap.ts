import type { MetadataRoute } from "next";

const siteUrl = "https://faa107training.org";
const lastModified = new Date("2026-07-11T00:00:00.000Z");

const staticRoutes = [
  "/",
  "/modules",
  "/flashcards",
  "/exam",
  "/cram-sheet",
  "/study-plan",
  "/dashboard",
  "/resources",
  "/about",
  "/exam/results",
];

const moduleRoutes = Array.from({ length: 13 }, (_, index) => `/modules/${index + 1}`);
const quizRoutes = moduleRoutes.map((route) => `${route}/quiz`);
const flashcardRoutes = moduleRoutes.map((route) => `${route}/flashcards`);
const weeklyRoutes = new Set(["/dashboard", "/exam", "/exam/results"]);

function priorityFor(route: string) {
  if (route === "/") return 1;
  if (route === "/modules") return 0.9;
  if (/^\/modules\/\d+$/.test(route)) return 0.8;
  if (/^\/modules\/\d+\/(quiz|flashcards)$/.test(route)) return 0.7;
  return 0.6;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...staticRoutes, ...moduleRoutes, ...quizRoutes, ...flashcardRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: weeklyRoutes.has(route) ? "weekly" : "monthly",
    priority: priorityFor(route),
  }));
}
