const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("@playwright/test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getAvailablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return address.port;
}

function startNextApp(port) {
  const output = [];
  const child = spawn(
    process.execPath,
    [path.join(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const capture = (chunk) => {
    output.push(chunk.toString());
    if (output.length > 80) output.shift();
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  return { child, output: () => output.join("") };
}

async function waitForNextApp(url, child, output) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready.\n${output()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The development server is still starting.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for Next.js.\n${output()}`);
}

async function stopNextApp(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(5_000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

function findCachedChromiumExecutable() {
  const cacheRoots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), "Library/Caches/ms-playwright"),
    path.join(os.homedir(), ".cache/ms-playwright"),
  ].filter(Boolean);
  const executableSuffixes = process.platform === "darwin"
    ? [
        "chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "chrome-headless-shell-mac-x64/chrome-headless-shell",
      ]
    : [
        "chrome-headless-shell-linux64/chrome-headless-shell",
        "chrome-headless-shell-linux/chrome-headless-shell",
      ];

  for (const cacheRoot of cacheRoots) {
    if (!fs.existsSync(cacheRoot)) continue;
    const browserDirectories = fs.readdirSync(cacheRoot)
      .filter((name) => name.startsWith("chromium_headless_shell-"))
      .sort()
      .reverse();
    for (const browserDirectory of browserDirectories) {
      for (const suffix of executableSuffixes) {
        const executable = path.join(cacheRoot, browserDirectory, suffix);
        if (fs.existsSync(executable)) return executable;
      }
    }
  }
  return null;
}

async function launchTestBrowser() {
  const expectedExecutable = chromium.executablePath();
  if (fs.existsSync(expectedExecutable)) return chromium.launch({ headless: true });

  const cachedExecutable = findCachedChromiumExecutable();
  assert.ok(cachedExecutable, `Playwright Chromium is not installed at ${expectedExecutable}`);
  return chromium.launch({ headless: true, executablePath: cachedExecutable });
}

function compileModule(relativePath, localRequire, jsx = ts.JsxEmit.None) {
  const absolutePath = path.join(root, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx,
    },
    fileName: absolutePath,
  }).outputText;
  const loaded = { exports: {} };
  const compile = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    output,
  );
  compile(
    loaded.exports,
    localRequire,
    loaded,
    absolutePath,
    path.dirname(absolutePath),
  );
  return loaded.exports;
}

function renderSlideViewer({ slideCount, initialIndex = 0, moduleProgress }) {
  const styles = new Proxy({}, { get: (_, name) => String(name) });
  const Icon = () => React.createElement("span", { "aria-hidden": "true" });
  const lucide = new Proxy({}, { get: () => Icon });
  let useStateCall = 0;
  const testReact = {
    ...React,
    useState: (initialValue) => {
      useStateCall += 1;
      return [useStateCall === 1 ? initialIndex : initialValue, () => {}];
    },
  };
  const omitMotionProps = ({ custom, initial, animate, exit, transition, ...props }) => props;
  const ui = {
    Badge: ({ children, ...props }) => React.createElement("span", props, children),
    Button: ({ asChild, children, variant, size, ...props }) =>
      asChild
        ? React.cloneElement(React.Children.only(children), props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }) => React.createElement("section", props, children),
    CardContent: ({ children, ...props }) => React.createElement("div", props, children),
    Progress: (props) => React.createElement("progress", props),
  };
  const Link = ({ href, children, ...props }) =>
    React.createElement("a", { href, ...props }, children);
  const localRequire = (specifier) => {
    if (specifier === "react") return testReact;
    if (specifier === "react/jsx-runtime") return require(specifier);
    if (specifier === "next/link") return { __esModule: true, default: Link };
    if (specifier === "next/image") return { __esModule: true, default: (props) => React.createElement("img", props) };
    if (specifier === "lucide-react") return lucide;
    if (specifier === "framer-motion") {
      return {
        AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
        motion: {
          article: ({ children, ...props }) =>
            React.createElement("article", omitMotionProps(props), children),
        },
        useReducedMotion: () => true,
      };
    }
    if (specifier === "@/components/ui/badge") return { Badge: ui.Badge };
    if (specifier === "@/components/ui/button") return { Button: ui.Button };
    if (specifier === "@/components/ui/card") return { Card: ui.Card, CardContent: ui.CardContent };
    if (specifier === "@/components/ui/progress") return { Progress: ui.Progress };
    if (specifier === "@/lib/progress-storage") {
      const progress = {
        modules: moduleProgress ? { "1": moduleProgress } : {},
      };
      return {
        addActivity: () => {},
        getProgress: () => progress,
        markSlideVisited: () => {},
        useProgress: () => progress,
      };
    }
    if (specifier === "@/lib/utils") return { isFocusContained: () => false };
    if (specifier.endsWith("modern-flight-school.module.css")) {
      return { __esModule: true, default: styles };
    }
    throw new Error(`Unexpected dependency: ${specifier}`);
  };
  const { SlideViewer } = compileModule(
    "components/slide-viewer.tsx",
    localRequire,
    ts.JsxEmit.ReactJSX,
  );
  const slides = Array.from({ length: slideCount }, (_, index) => ({
    id: `slide-${index + 1}`,
    title: `Slide ${index + 1}`,
    blocks: [{ type: "paragraph", text: `Lesson content ${index + 1}` }],
  }));

  return renderToStaticMarkup(
    React.createElement(SlideViewer, {
      courseModule: {
        id: "1",
        number: 1,
        title: "Regulations",
        description: "Know the operating rules.",
        estimatedMinutes: 10,
        topicArea: "Regulations",
        slides,
      },
    }),
  );
}

test("incomplete persisted progress on the final slide shows review guidance without completion claims", () => {
  const html = renderSlideViewer({
    slideCount: 3,
    initialIndex: 2,
    moduleProgress: {
      visitedSlideIds: ["slide-3"],
      lastSlideId: "slide-3",
      completed: false,
    },
  });

  assert.doesNotMatch(html, /Module Complete/);
  assert.doesNotMatch(html, /Module completion recorded on this device\./);
  assert.doesNotMatch(html, /href="\/dashboard"/);
  assert.match(html, /Review the remaining slides to complete this module\./);
  assert.match(html, />Review Remaining Slides</);
});

test("completed persisted progress on the final slide renders truthful completion exit actions", () => {
  const html = renderSlideViewer({
    slideCount: 3,
    initialIndex: 2,
    moduleProgress: {
      visitedSlideIds: ["slide-1", "slide-2", "slide-3"],
      lastSlideId: "slide-3",
      completed: true,
    },
  });

  assert.match(html, />Module Complete</);
  assert.match(html, /Module completion recorded on this device\./);
  assert.match(html, /href="\/dashboard"[^>]*>.*Return to Dashboard/s);
  assert.match(html, />Review Module</);
  assert.doesNotMatch(html, />Next</);
});

test("non-final slides retain Next navigation without completion UI", () => {
  const html = renderSlideViewer({
    slideCount: 3,
    initialIndex: 1,
    moduleProgress: {
      visitedSlideIds: ["slide-1", "slide-2"],
      lastSlideId: "slide-2",
      completed: false,
    },
  });

  assert.match(html, />Next</);
  assert.doesNotMatch(html, /Module Complete/);
  assert.doesNotMatch(html, /Module completion recorded on this device\./);
  assert.doesNotMatch(html, /href="\/dashboard"/);
  assert.doesNotMatch(html, /Review the remaining slides to complete this module\./);
});

test("visiting every slide still records local module completion", () => {
  const originalWindow = global.window;
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    dispatchEvent: () => true,
  };

  try {
    const { getProgress, markSlideVisited } = compileModule(
      "lib/progress-storage.ts",
      (specifier) => {
        if (specifier === "react") return React;
        if (specifier === "@/lib/exam-session") {
          return { restoreActiveExamSession: () => null };
        }
        throw new Error(`Unexpected dependency: ${specifier}`);
      },
    );

    markSlideVisited("1", "slide-1", 2);
    assert.equal(getProgress().modules["1"].completed, false);

    markSlideVisited("1", "slide-2", 2);
    assert.deepEqual(getProgress().modules["1"], {
      visitedSlideIds: ["slide-1", "slide-2"],
      lastSlideId: "slide-2",
      completed: true,
    });
  } finally {
    global.window = originalWindow;
  }
});

test("interactive final-slide recovery persists completion before exposing completion exits", { timeout: 120_000 }, async () => {
  const port = await getAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const app = startNextApp(port);
  let browser;

  try {
    await waitForNextApp(`${origin}/modules/1`, app.child, app.output);
    browser = await launchTestBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    const browserErrors = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto(`${origin}/modules/1`, { waitUntil: "domcontentloaded" });
    await page.getByText("Slide 1 of 8", { exact: true }).waitFor();
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem("faa107-progress-v1");
      const moduleProgress = raw ? JSON.parse(raw).modules?.["1"] : null;
      return moduleProgress?.completed === false && moduleProgress.visitedSlideIds.length === 1;
    });

    await page.getByRole("button", { name: "Go to slide 8", exact: true }).click();
    const pendingHeading = page.getByRole("heading", { name: "Complete the remaining slides", exact: true });
    try {
      await pendingHeading.waitFor({ timeout: 10_000 });
    } catch (error) {
      const renderedState = await page.locator("main").innerText();
      const storedProgress = await page.evaluate(() => window.localStorage.getItem("faa107-progress-v1"));
      error.message = `${error.message}\nRendered main:\n${renderedState}\nStored progress:\n${storedProgress}`;
      throw error;
    }
    assert.equal(await page.getByRole("heading", { name: "Module Complete", exact: true }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Return to Dashboard", exact: true }).count(), 0);
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem("faa107-progress-v1");
      const moduleProgress = raw ? JSON.parse(raw).modules?.["1"] : null;
      return moduleProgress?.completed === false && moduleProgress.visitedSlideIds.length === 2;
    });

    await page.getByRole("button", { name: "Review Remaining Slides", exact: true }).click();
    await page.getByText("Slide 2 of 8", { exact: true }).waitFor();
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem("faa107-progress-v1");
      const moduleProgress = raw ? JSON.parse(raw).modules?.["1"] : null;
      return moduleProgress?.completed === false && moduleProgress.visitedSlideIds.length === 3;
    });

    for (let slideNumber = 3; slideNumber <= 7; slideNumber += 1) {
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page.getByText(`Slide ${slideNumber} of 8`, { exact: true }).waitFor();
    }
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem("faa107-progress-v1");
      const moduleProgress = raw ? JSON.parse(raw).modules?.["1"] : null;
      return moduleProgress?.completed === true && moduleProgress.visitedSlideIds.length === 8;
    });
    assert.equal(await page.getByRole("heading", { name: "Module Complete", exact: true }).count(), 0);

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("heading", { name: "Module Complete", exact: true }).waitFor();
    assert.equal(await page.getByText("Module completion recorded on this device.", { exact: true }).count(), 1);
    assert.equal(await page.getByRole("link", { name: "Return to Dashboard", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Review Remaining Slides", exact: true }).count(), 0);
    assert.deepEqual(browserErrors, []);

    await context.close();
  } catch (error) {
    error.message = `${error.message}\nNext.js output:\n${app.output()}`;
    throw error;
  } finally {
    if (browser) await browser.close();
    await stopNextApp(app.child);
  }
});

test("the modules page hydrates saved local progress cleanly at 390px", { timeout: 120_000 }, async () => {
  const port = await getAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const app = startNextApp(port);
  let browser;

  try {
    await waitForNextApp(`${origin}/modules`, app.child, app.output);
    browser = await launchTestBrowser();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      window.localStorage.setItem("faa107-progress-v1", JSON.stringify({
        version: 1,
        modules: {
          "1": { visitedSlideIds: ["m1-1", "m1-2", "m1-3", "m1-4", "m1-5", "m1-6", "m1-7", "m1-8"], completed: true },
          "2": { visitedSlideIds: ["m2-1", "m2-2", "m2-3", "m2-4", "m2-5", "m2-6", "m2-7", "m2-8"], completed: true },
          "3": { visitedSlideIds: ["m3-1"], completed: false },
        },
        quizAttempts: [
          { id: "latest", moduleId: "3", score: 8, total: 10, completedAt: "2026-07-12T14:00:00.000Z", topicScores: {} },
          { id: "older", moduleId: "3", score: 4, total: 10, completedAt: "2026-07-11T14:00:00.000Z", topicScores: {} },
        ],
        flashcards: {},
        examAttempts: [],
        recentActivity: [],
      }));
    });
    const page = await context.newPage();
    const browserErrors = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto(`${origin}/modules`, { waitUntil: "networkidle" });
    await page.getByText("Latest quiz: 8/10 · 80%", { exact: true }).waitFor();
    assert.equal(await page.getByText("Complete", { exact: true }).count(), 2);
    assert.equal(await page.getByRole("link", { name: "Review module", exact: true }).count(), 2);
    assert.equal(await page.getByText(/% lesson progress$/).count(), 1);
    assert.equal(await page.getByRole("link", { name: "Resume module", exact: true }).count(), 1);
    assert.equal(await page.getByRole("link", { name: "Retake quiz", exact: true }).getAttribute("href"), "/modules/3/quiz");
    assert.equal(await page.getByText(/Latest quiz: 4\/10/).count(), 0);
    assert.equal(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth), true);
    assert.deepEqual(browserErrors, []);

    await context.close();
  } catch (error) {
    error.message = `${error.message}\nNext.js output:\n${app.output()}`;
    throw error;
  } finally {
    if (browser) await browser.close();
    await stopNextApp(app.child);
  }
});
