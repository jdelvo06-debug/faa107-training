const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design lab exposes a gallery and exactly three prototype routes", () => {
  const routes = [
    "app/design-lab/page.tsx",
    "app/design-lab/landing/page.tsx",
    "app/design-lab/dashboard/page.tsx",
    "app/design-lab/exam/page.tsx",
  ];

  for (const route of routes) {
    assert.ok(fs.existsSync(path.join(root, route)), `${route} should exist`);
  }

  const gallery = read(routes[0]);
  assert.match(gallery, /\/design-lab\/landing/);
  assert.match(gallery, /\/design-lab\/dashboard/);
  assert.match(gallery, /\/design-lab\/exam/);
});

test("landing prototype implements the selected Modern Flight School visual contract", () => {
  const landing = read("app/design-lab/landing/page.tsx");
  const styles = read("app/design-lab/design-lab.module.css");

  assert.match(landing, /modern-flight-school-hero\.png/);
  assert.match(landing, /Clear lessons\. Confident decisions\./);
  assert.match(landing, /modules\.length/);
  assert.match(landing, /<strong>120<\/strong>-minute exam/);
  assert.match(landing, /<strong>70%<\/strong> passing score/);
  assert.match(styles, /--studio-cream:/);
  assert.match(styles, /--studio-teal:/);
  assert.match(styles, /--studio-coral:/);
  assert.match(styles, /@media \(max-width: 640px\)/);
});

test("design lab escapes the production shell as a full-viewport prototype", () => {
  const styles = read("app/design-lab/design-lab.module.css");

  assert.match(styles, /\.studioPage\s*\{[^}]*position:\s*fixed;/s);
  assert.match(styles, /\.studioPage\s*\{[^}]*inset:\s*0;/s);
  assert.match(styles, /\.studioPage\s*\{[^}]*z-index:\s*100;/s);
  assert.match(styles, /\.studioPage\s*\{[^}]*overflow-y:\s*auto;/s);
});

test("mobile landing headline remains inside the 390px prototype viewport", () => {
  const styles = read("app/design-lab/design-lab.module.css");

  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.heroCopy h1\s*\{[^}]*font-size:\s*clamp\(54px, 16vw, 64px\);/);
});

test("design lab exposes one main landmark and hides the production navigation from assistive technology", () => {
  const shell = read("app/design-lab/studio-shell.tsx");
  const routeFiles = [
    "app/design-lab/page.tsx",
    "app/design-lab/landing/page.tsx",
    "app/design-lab/dashboard/dashboard-prototype.tsx",
    "app/design-lab/exam/exam-prototype.tsx",
  ];

  assert.match(shell, /querySelectorAll\("\.app-mobile-header, \.app-desktop-sidebar"\)/);
  assert.match(shell, /setAttribute\("aria-hidden", "true"\)/);
  assert.match(shell, /removeAttribute\("aria-hidden"\)/);
  for (const routeFile of routeFiles) {
    assert.doesNotMatch(read(routeFile), /<\/?main(?:\s|>)/, `${routeFile} should rely on the existing root main landmark`);
  }
});

test("design lab navigation matches the selected Modern Flight School information architecture", () => {
  const shell = read("app/design-lab/studio-shell.tsx");

  assert.match(
    shell,
    /label: "Home"[\s\S]*label: "Modules"[\s\S]*label: "Practice"[\s\S]*label: "Exam"[\s\S]*label: "Resources"[\s\S]*label: "About"/,
  );
  assert.doesNotMatch(shell, /label: "Dashboard"/);
});

test("dashboard prototype preserves existing progress authority", () => {
  const dashboard = read("app/design-lab/dashboard/dashboard-prototype.tsx");

  assert.match(dashboard, /getProgress/);
  assert.match(dashboard, /getOverallProgress/);
  assert.match(dashboard, /getFlashcardTotals/);
  assert.match(dashboard, /getWeakAreas/);
  assert.match(dashboard, /getResumeTarget/);
  assert.match(dashboard, /getTopicModuleHref/);
});

test("exam prototype uses real questions and exposes interactive assessment states", () => {
  const page = read("app/design-lab/exam/page.tsx");
  const prototype = read("app/design-lab/exam/exam-prototype.tsx");

  assert.match(page, /examQuestions/);
  assert.match(prototype, /useState/);
  assert.match(prototype, /role="radiogroup"/);
  assert.match(prototype, /aria-checked/);
  assert.match(prototype, /Flag for review/);
  assert.match(prototype, /Review answers/);
});
