const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("every production route uses the approved flight-school shell", () => {
  const appShell = read("components/app-shell.tsx");

  assert.match(appShell, /ModernFlightSchoolShell/);
  assert.match(appShell, /<ModernFlightSchoolShell>\{children\}<\/ModernFlightSchoolShell>/);
  assert.doesNotMatch(appShell, /usePathname/);
});

test("approved production shell exposes the selected navigation and mobile menu", () => {
  assert.ok(fs.existsSync(path.join(root, "components/modern-flight-school-shell.tsx")));
  const shell = read("components/modern-flight-school-shell.tsx");

  assert.match(
    shell,
    /label: "Home"[\s\S]*label: "Modules"[\s\S]*label: "Flashcards"[\s\S]*label: "Exam"[\s\S]*label: "Dashboard"[\s\S]*label: "Study Plan"[\s\S]*label: "Cram Sheet"[\s\S]*label: "Resources"[\s\S]*label: "About"/,
  );
  assert.match(shell, /aria-expanded=\{menuOpen\}/);
  assert.match(shell, /Start learning/);
});

test("production landing page uses the approved photographic hero and learning path", () => {
  const landing = read("app/page.tsx");

  assert.match(landing, /modern-flight-school-hero\.png/);
  assert.match(landing, /Clear lessons\. Confident decisions\./);
  assert.match(landing, /Your learning path/);
  assert.match(landing, /<strong>120<\/strong>-minute exam/);
  assert.match(landing, /<strong>70%<\/strong> passing score/);
});

test("production dashboard adopts the approved hierarchy without losing learner controls", () => {
  const dashboard = read("components/dashboard-summary.tsx");

  assert.match(dashboard, /modern-flight-school\.module\.css/);
  assert.match(dashboard, /Welcome back, pilot\./);
  assert.match(dashboard, /Next best action/);
  assert.match(dashboard, /resetProgress/);
  assert.match(dashboard, /progress\.recentActivity/);
  assert.match(dashboard, /getWeakAreas/);
  assert.match(dashboard, /getResumeTarget/);
});

test("production exam adopts the approved visual states without replacing assessment integrity", () => {
  const exam = read("components/practice-exam.tsx");

  assert.match(exam, /modern-flight-school\.module\.css/);
  assert.match(exam, /Calm focus for test-day decisions\./);
  assert.match(exam, /Review your answers/);
  assert.match(exam, /getActiveExamSession/);
  assert.match(exam, /saveActiveExamSession/);
  assert.match(exam, /createExamSubmissionController/);
  assert.match(exam, /completeExamAttempt/);
  assert.match(exam, /persistenceWarning/);
  assert.match(exam, /completionFallback/);
});

test("production exam states expose a proper page and question heading hierarchy", () => {
  const exam = read("components/practice-exam.tsx");

  assert.match(exam, /<h1 className=\{styles\.examPageTitle\}>Calm focus for test-day decisions\.<\/h1>/);
  assert.match(exam, /<h1 className=\{styles\.examReviewTitle\}>Review your answers<\/h1>/);
  assert.match(exam, /<h2 id=\{`question-prompt-\$\{question\.sourceQuestionId\}`\} className=\{styles\.examQuestionTitle\}>/);
});

test("exam results continue the approved production experience", () => {
  const results = read("app/exam/results/page.tsx");

  assert.match(results, /modern-flight-school\.module\.css/);
  assert.match(results, /styles\.resultsMain/);
  assert.match(results, /styles\.resultsHero/);
  assert.match(results, /<h1>No exam result yet<\/h1>/);
  assert.match(results, /Topic breakdown/);
  assert.match(results, /Detailed answer review/);
});

test("approved production styles include focus, mobile, and reduced-motion safeguards", () => {
  assert.ok(fs.existsSync(path.join(root, "components/modern-flight-school.module.css")));
  const styles = read("components/modern-flight-school.module.css");

  assert.match(styles, /--flight-cream:/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /:global\(\.text-amber-100\)/);
  assert.match(styles, /:global\(\.text-sky-100\)/);
});
