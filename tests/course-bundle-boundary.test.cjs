const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const metadataPath = path.join(root, "lib/course-metadata.ts");
const fullCoursePath = path.join(root, "lib/course-data.ts");
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
    if (specifier.startsWith("./")) {
      return loadTypeScriptModule(
        path.join(path.dirname(withExtension), specifier),
      );
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

function resolveLocalImport(fromPath, specifier) {
  let basePath;
  if (specifier.startsWith("@/")) {
    basePath = path.join(root, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    basePath = path.resolve(path.dirname(fromPath), specifier);
  } else {
    return null;
  }

  const candidates = path.extname(basePath)
    ? [basePath]
    : [
        `${basePath}.ts`,
        `${basePath}.tsx`,
        path.join(basePath, "index.ts"),
        path.join(basePath, "index.tsx"),
      ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function findImportPath(entryRelativePath, targetPath) {
  const entryPath = path.join(root, entryRelativePath);
  const queue = [[entryPath]];
  const visited = new Set();

  while (queue.length) {
    const importPath = queue.shift();
    const currentPath = importPath.at(-1);
    if (currentPath === targetPath) return importPath;
    if (visited.has(currentPath)) continue;
    visited.add(currentPath);

    const source = fs.readFileSync(currentPath, "utf8");
    const importedFiles = ts.preProcessFile(source, true, true).importedFiles;
    for (const importedFile of importedFiles) {
      const resolved = resolveLocalImport(currentPath, importedFile.fileName);
      if (resolved && !visited.has(resolved)) {
        queue.push([...importPath, resolved]);
      }
    }
  }

  return null;
}

function emptyProgress(overrides = {}) {
  return {
    version: 1,
    modules: {},
    quizAttempts: [],
    flashcards: {},
    examAttempts: [],
    recentActivity: [],
    ...overrides,
  };
}

test("lightweight metadata stays aligned with the canonical 13-module curriculum", () => {
  assert.equal(
    fs.existsSync(metadataPath),
    true,
    "Extract module identity and slide-order metadata to lib/course-metadata.ts",
  );

  const { courseModuleMetadata } = loadTypeScriptModule(
    "lib/course-metadata",
  );
  const { modules } = loadTypeScriptModule("lib/course-data");

  assert.equal(courseModuleMetadata.length, 13);
  assert.deepEqual(
    courseModuleMetadata.map((courseModule) => courseModule.id),
    Array.from({ length: 13 }, (_, index) => String(index + 1)),
  );
  assert.deepEqual(
    courseModuleMetadata.map((courseModule) => courseModule.slideIds.length),
    [8, 12, 10, 10, 10, 10, 10, 10, 8, 8, 8, 7, 7],
  );
  assert.equal(
    courseModuleMetadata.every((courseModule) => !("slides" in courseModule)),
    true,
  );
  assert.deepEqual(
    courseModuleMetadata.map((courseModule) => ({
      id: courseModule.id,
      number: courseModule.number,
      title: courseModule.title,
      description: courseModule.description,
      estimatedMinutes: courseModule.estimatedMinutes,
      topicArea: courseModule.topicArea,
      slideIds: [...courseModule.slideIds],
    })),
    modules.map((courseModule) => ({
      id: courseModule.id,
      number: courseModule.number,
      title: courseModule.title,
      description: courseModule.description,
      estimatedMinutes: courseModule.estimatedMinutes,
      topicArea: courseModule.topicArea,
      slideIds: courseModule.slides.map((slide) => slide.id),
    })),
  );

  const metadataSource = fs.readFileSync(metadataPath, "utf8");
  assert.doesNotMatch(metadataSource, /@\/lib\/course-data/);
  assert.doesNotMatch(metadataSource, /\bblocks\s*:/);
});

test("global shell and lightweight route graphs cannot reach full lesson bodies", () => {
  const lightweightEntries = [
    "app/layout.tsx",
    "app/page.tsx",
    "app/about/page.tsx",
    "app/dashboard/page.tsx",
    "app/resources/page.tsx",
    "app/exam/page.tsx",
    "app/modules/page.tsx",
    "components/dashboard-summary.tsx",
    "components/module-card-grid.tsx",
    "components/module-nav.tsx",
  ];

  for (const entry of lightweightEntries) {
    const importPath = findImportPath(entry, fullCoursePath);
    assert.equal(
      importPath,
      null,
      importPath
        ? `${entry} reaches full lesson bodies through ${importPath
            .map((item) => path.relative(root, item))
            .join(" -> ")}`
        : undefined,
    );
  }

  assert.notEqual(
    findImportPath("app/modules/[id]/page.tsx", fullCoursePath),
    null,
    "The lesson route must retain route-scoped access to full slide bodies",
  );
  assert.equal(
    findImportPath("app/modules/[id]/quiz/page.tsx", fullCoursePath),
    null,
  );
  assert.equal(
    findImportPath("app/modules/[id]/flashcards/page.tsx", fullCoursePath),
    null,
  );
});

test("representative lesson, quiz, and flashcard content keeps stable IDs", () => {
  const { getModule } = loadTypeScriptModule("lib/course-data");
  const { getQuestionsForModule } = loadTypeScriptModule("lib/questions");
  const { getFlashcardsForModule } = loadTypeScriptModule("lib/flashcards");
  const courseModule = getModule("1");

  assert.equal(courseModule.title, "Welcome & Getting Started");
  assert.deepEqual(
    courseModule.slides.map((slide) => slide.id),
    ["m1-1", "m1-2", "m1-3", "m1-4", "m1-5", "m1-6", "m1-7", "m1-8"],
  );
  assert.equal(courseModule.slides[0].title, "Your Part 107 Flight Plan");
  assert.match(courseModule.slides[0].blocks[0].text, /FAA rule set/);
  const questions = getQuestionsForModule("1");
  assert.deepEqual(
    questions.map((question) => question.id),
    ["m1-q1", "m1-q2", "m1-q3", "m1-q4", "m1-q5", "m1-q6"],
  );
  assert.equal(
    questions[0].prompt,
    "What is the minimum age to be eligible for a Remote Pilot Certificate under Part 107?",
  );
  const cards = getFlashcardsForModule("1");
  assert.deepEqual(
    cards.map((card) => card.id),
    [
      "fc-1-ftn",
      "fc-1-uag",
      "fc-1-pass",
      "fc-1-iacra",
      "fc-1-laanc",
      "fc-1-vlos",
    ],
  );
  assert.deepEqual(
    { front: cards[0].front, back: cards[0].back },
    {
      front: "FTN",
      back: "FAA Tracking Number, obtained through IACRA before scheduling the knowledge test.",
    },
  );
});

test("progress resume keeps the existing module route and slide number", () => {
  const { getResumeTarget } = loadTypeScriptModule(
    "lib/progress-selectors",
  );
  const target = getResumeTarget(
    emptyProgress({
      modules: {
        "2": {
          visitedSlideIds: ["m2-1", "m2-2", "m2-3"],
          lastSlideId: "m2-3",
          completed: false,
        },
      },
      recentActivity: [
        {
          id: "recent-module-2",
          label: "Viewed Module 2",
          href: "/modules/2",
          at: "2026-07-14T12:00:00.000Z",
        },
      ],
    }),
  );

  assert.deepEqual(target, {
    label: "Resume Module 2, slide 3",
    href: "/modules/2",
  });
});
