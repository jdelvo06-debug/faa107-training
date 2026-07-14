const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

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
const moduleCache = new Map();

function loadTypeScriptModule(relativePath) {
  const withExtension = relativePath.endsWith(".ts")
    ? relativePath
    : `${relativePath}.ts`;
  const absolutePath = path.join(root, withExtension);
  if (moduleCache.has(absolutePath)) {
    return moduleCache.get(absolutePath).exports;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  }).outputText;
  const loaded = { exports: {} };
  moduleCache.set(absolutePath, loaded);
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      return loadTypeScriptModule(specifier.slice(2));
    }
    return require(specifier);
  };

  new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    output,
  )(
    loaded.exports,
    localRequire,
    loaded,
    absolutePath,
    path.dirname(absolutePath),
  );
  return loaded.exports;
}

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

  const { CRAM_WEATHER_MINIMUMS } = loadTypeScriptModule(
    "lib/cram-sheet-data",
  );
  assert.deepEqual(CRAM_WEATHER_MINIMUMS, [
    {
      id: "visibility",
      label: "Part 107 minimum visibility",
      value: "3 SM from the control station",
    },
    {
      id: "cloud-clearance",
      label: "Part 107 cloud distance",
      value: "At least 500 ft below and 2,000 ft horizontally",
    },
  ]);
});

test("Part 107 registration is not limited by the recreational 0.55-pound threshold", () => {
  for (const file of ["lib/course-data.ts", "research/regulations.md"]) {
    const content = read(file);
    assert.doesNotMatch(
      content,
      /Registration[^\n\"]{0,50}(?:required )?(?:if|for aircraft)\s*(?:>|&gt;|over)\s*0\.55/i,
    );
    assert.match(content, /all drones? operated under (?:14 CFR )?Part 107.*register/i);
  }

  const { CRAM_OPERATING_LIMITS } = loadTypeScriptModule(
    "lib/cram-sheet-data",
  );
  assert.equal(
    CRAM_OPERATING_LIMITS.find((item) => item.id === "registration").value,
    "All drones operated under Part 107 must be registered",
  );
});

test("all alcohol learner surfaces retain the independent 0.04 prohibition", () => {
  assert.match(read("lib/course-data.ts"), /0\.04/);
  const { ALCOHOL_DRUG_SUMMARY } = loadTypeScriptModule(
    "lib/regulatory-sources",
  );
  const { moduleQuestions } = loadTypeScriptModule("lib/questions");
  const { flashcards } = loadTypeScriptModule("lib/flashcards");
  const question = moduleQuestions.find((item) => item.id === "m9-q1");
  const card = flashcards.find((item) => item.id === "fc-9-alcohol-8hr");

  assert.match(ALCOHOL_DRUG_SUMMARY, /0\.04/);
  assert.equal(question.choices[question.correctIndex], ALCOHOL_DRUG_SUMMARY);
  assert.equal(card.back, ALCOHOL_DRUG_SUMMARY);
  assert.doesNotMatch(learnerContent, /BAC (?:number )?does not matter/i);
});

test("ACS weights have one shared source and no obsolete learner-facing ranges", () => {
  const { ACS_TOPIC_WEIGHTS } = loadTypeScriptModule("lib/acs-weights");
  assert.deepEqual(ACS_TOPIC_WEIGHTS, {
    regulations: "15–25%",
    airspace: "15–25%",
    weather: "11–16%",
    loadingPerformance: "7–11%",
    operations: "35–45%",
  });

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

test("research links the live official FAA remote-pilot study guide", () => {
  const research = read("research/regulations.md");
  assert.doesNotMatch(
    research,
    /faa\.gov\/regulations_policies\/handbooks_manuals\/aviation\/remote_pilot_study_guide\.pdf/,
  );
  assert.match(
    research,
    /faa\.gov\/sites\/faa\.gov\/files\/regulations_policies\/handbooks_manuals\/aviation\/remote_pilot_study_guide\.pdf/,
  );
});

test("operations-over-people cram guidance preserves category distinctions", () => {
  const { CRAM_OPERATIONS_OVER_PEOPLE } = loadTypeScriptModule(
    "lib/cram-sheet-data",
  );
  assert.deepEqual(
    CRAM_OPERATIONS_OVER_PEOPLE.map((item) => item.category),
    ["Category 1", "Category 2", "Category 3", "Category 4"],
  );

  const category3 = CRAM_OPERATIONS_OVER_PEOPLE.find(
    (item) => item.id === "category-3",
  ).rule;
  assert.match(category3, /25 foot-pounds/i);
  assert.match(category3, /lacerating rotating parts/i);
  assert.match(category3, /safety defect/i);
  assert.match(category3, /No open-air assemblies/i);
});
