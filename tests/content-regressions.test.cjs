const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const learnerContentRoots = ["app", "components", "lib", "research"];
const learnerContentExtensions = new Set([".ts", ".tsx", ".md", ".mdx"]);
const excludedContentDirectories = new Set([
  "tests",
  "node_modules",
  ".next",
  "docs",
  "audits",
  "build",
  "dist",
  "out",
  "coverage",
]);

function collectLearnerFiles(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      return excludedContentDirectories.has(entry.name)
        ? []
        : collectLearnerFiles(relativePath);
    }

    return entry.isFile() && learnerContentExtensions.has(path.extname(entry.name))
      ? [relativePath]
      : [];
  });
}

const learnerFiles = learnerContentRoots.flatMap(collectLearnerFiles).sort();

const learnerContent = learnerFiles.map(read).join("\n");

test("public course and research content contains no owner-specific career data", () => {
  const personalDataPatterns = [
    /TS\/SCI/i,
    /(?:top secret|security)\s*(?:\/\s*SCI|clearance)/i,
    /(?:active|current)\s+(?:security\s+)?clearance/i,
    /terminal leave/i,
    /31 Jan 2027/i,
    /retirement transition/i,
    /(?:retirement|separation)\s+(?:date|timeline|plan|transition)[^\n]{0,60}\b20\d{2}\b/i,
    /combat-tested/i,
    /AFCENT/i,
    /Jeremy(?:'s)?/i,
    /Your Air Force/i,
    /Air Force contacts/i,
    /You've been doing CRM for years in the Air Force/i,
    /military instructor background/i,
    /(?:I|we|Jeremy)[^.\n]{0,100}\b(?:served|serve|served as|was)\b[^.\n]{0,100}\b(?:Air Force|military|AFCENT|C-?UAS)\b/i,
    /(?:Air Force|military|C-?UAS)[^.\n]{0,80}\b(?:career|background|experience|instructor|operator|veteran)\b/i,
  ];

  for (const file of learnerFiles) {
    const content = read(file);
    for (const pattern of personalDataPatterns) {
      assert.doesNotMatch(content, pattern, `${file} matched ${pattern}`);
    }
  }
});

test("Part 107 weather guidance does not substitute manned Class G minima", () => {
  assert.doesNotMatch(learnerContent, /Class G day \(&lt;1,200 ft\)/i);
  assert.doesNotMatch(learnerContent, /Class G night:/i);
  assert.doesNotMatch(
    learnerContent,
    /VFR weather minimums[\s\S]{0,100}1 mile visibility, clear of clouds/i,
  );
  assert.doesNotMatch(learnerContent, /Know Class G visibility minimums cold/i);

  for (const file of ["lib/course-data.ts", "app/cram-sheet/page.tsx"]) {
    const content = read(file);
    assert.match(content, /3 statute miles|3 SM/i);
    assert.match(content, /500 (?:ft|feet) below/i);
    assert.match(content, /2,000 (?:ft|feet) horizontal/i);
    assert.match(content, /107\.51/);
  }
});

test("Part 107 registration is not limited by the recreational 0.55-pound threshold", () => {
  for (const file of [
    "lib/course-data.ts",
    "app/cram-sheet/page.tsx",
    "research/regulations.md",
  ]) {
    const content = read(file);
    assert.doesNotMatch(
      content,
      /Registration[^\n\"]{0,50}(?:required )?(?:if|for aircraft)\s*(?:>|&gt;|over)\s*0\.55/i,
    );
    assert.match(content, /all drones? operated under (?:14 CFR )?Part 107.*register/i);
  }
});

test("all alcohol learner surfaces retain the independent 0.04 prohibition", () => {
  for (const file of [
    "lib/course-data.ts",
    "lib/questions.ts",
    "lib/flashcards.ts",
  ]) {
    const content = read(file);
    assert.match(content, /0\.04/);
    assert.doesNotMatch(content, /BAC (?:number )?does not matter/i);
  }
});

test("ACS weights have one shared source and no obsolete learner-facing ranges", () => {
  const sharedPath = path.join(root, "lib/acs-weights.ts");
  assert.equal(fs.existsSync(sharedPath), true, "missing shared ACS weights source");

  const shared = read("lib/acs-weights.ts");
  assert.match(shared, /regulations:\s*"15–25%"/);
  assert.match(shared, /airspace:\s*"15–25%"/);
  assert.match(shared, /weather:\s*"11–16%"/);
  assert.match(shared, /loadingPerformance:\s*"7–11%"/);
  assert.match(shared, /operations:\s*"35–45%"/);

  for (const file of [
    "lib/course-data.ts",
    "lib/questions.ts",
    "lib/flashcards.ts",
    "app/cram-sheet/page.tsx",
  ]) {
    assert.match(read(file), /@\/lib\/acs-weights/);
  }

  const weightedSurfaces = [
    "lib/course-data.ts",
    "lib/questions.ts",
    "lib/flashcards.ts",
    "app/cram-sheet/page.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(weightedSurfaces, /Regulations[^\n\"]{0,30}30-40%/i);
  assert.doesNotMatch(weightedSurfaces, /Airspace[^\n\"]{0,40}25-35%/i);
  assert.doesNotMatch(weightedSurfaces, /Regulations \+ Airspace = 55-75%/i);
});

test("exam reference guidance acknowledges the FAA testing supplement", () => {
  const course = read("lib/course-data.ts");
  assert.doesNotMatch(course, /No reference materials allowed/i);
  assert.doesNotMatch(course, /Everything must be from memory/i);
  assert.match(course, /FAA-CT-8080-2H/);
  assert.match(course, /testing supplement/i);
});

test("operations-over-people cram guidance preserves category distinctions", () => {
  const cram = read("app/cram-sheet/page.tsx");
  assert.doesNotMatch(
    cram,
    /Categories 1-4 \(no exposed rotating parts for sustained flight over open-air\)/i,
  );
  for (const category of ["Category 1", "Category 2", "Category 3", "Category 4"]) {
    assert.match(cram, new RegExp(category));
  }
  assert.match(cram, /declaration/i);
  assert.match(cram, /label/i);
  assert.match(cram, /Remote ID/i);
  assert.match(cram, /Category 3[^\n]{0,500}25 foot-pounds/i);
  assert.match(cram, /Category 3[^\n]{0,500}exposed rotating parts[^\n]{0,100}lacerat/i);
  assert.match(cram, /Category 3[^\n]{0,500}(?:safety defects?[^\n]{0,100}undue hazard|undue hazard[^\n]{0,100}safety defects?)/i);
  assert.match(cram, /Category 3[^\n]{0,200}(?:no open-air assemblies|not.*open-air assemblies)/i);
});
