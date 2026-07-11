const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

function loadTypeScriptModule(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  }).outputText;
  const loaded = { exports: {} };
  const compile = new Function("exports", "require", "module", output);
  compile(loaded.exports, require, loaded);
  return loaded.exports;
}

test("PWA manifest exposes the required standalone identity and raster icons", () => {
  const { default: manifest } = loadTypeScriptModule("app/manifest.ts");

  assert.deepEqual(manifest(), {
    name: "FAA Part 107 Training Platform",
    short_name: "Part 107",
    description: "Free FAA Part 107 remote pilot certification study platform",
    start_url: "/",
    display: "standalone",
    background_color: "#061525",
    theme_color: "#f59e0b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  });

  for (const icon of [
    "public/icons/icon-192.png",
    "public/icons/icon-512.png",
    "public/icons/apple-touch-icon.png",
    "public/favicon.svg",
  ]) {
    assert.equal(fs.existsSync(path.join(root, icon)), true, `missing ${icon}`);
  }
});

test("robots allows all routes and advertises the canonical sitemap", () => {
  const { default: robots } = loadTypeScriptModule("app/robots.ts");

  assert.deepEqual(robots(), {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://faa107training.org/sitemap.xml",
  });
});

test("sitemap contains every required canonical route with route-specific policy", () => {
  const { default: sitemap } = loadTypeScriptModule("app/sitemap.ts");
  const entries = sitemap();
  const expectedPaths = [
    "/", "/modules", "/flashcards", "/exam", "/cram-sheet", "/study-plan",
    "/dashboard", "/resources", "/about", "/exam/results",
    ...Array.from({ length: 13 }, (_, index) => `/modules/${index + 1}`),
    ...Array.from({ length: 13 }, (_, index) => `/modules/${index + 1}/quiz`),
    ...Array.from({ length: 13 }, (_, index) => `/modules/${index + 1}/flashcards`),
  ];

  assert.equal(entries.length, 49);
  assert.deepEqual(entries.map(({ url }) => new URL(url).pathname), expectedPaths);
  assert.equal(entries.every(({ url }) => url.startsWith("https://faa107training.org/")), true);
  assert.equal(entries.every(({ lastModified }) => lastModified instanceof Date), true);

  const byPath = new Map(entries.map((entry) => [new URL(entry.url).pathname, entry]));
  assert.deepEqual(
    { frequency: byPath.get("/").changeFrequency, priority: byPath.get("/").priority },
    { frequency: "monthly", priority: 1 },
  );
  assert.deepEqual(
    { frequency: byPath.get("/modules").changeFrequency, priority: byPath.get("/modules").priority },
    { frequency: "monthly", priority: 0.9 },
  );
  assert.deepEqual(
    { frequency: byPath.get("/modules/1").changeFrequency, priority: byPath.get("/modules/1").priority },
    { frequency: "monthly", priority: 0.8 },
  );
  assert.deepEqual(
    { frequency: byPath.get("/modules/1/quiz").changeFrequency, priority: byPath.get("/modules/1/quiz").priority },
    { frequency: "monthly", priority: 0.7 },
  );
  assert.equal(byPath.get("/exam").changeFrequency, "weekly");
  assert.equal(byPath.get("/dashboard").changeFrequency, "weekly");
  assert.equal(byPath.get("/about").priority, 0.6);
});

test("root and key route metadata plus viewport cover the Phase 4 contract", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /metadataBase:\s*new URL\("https:\/\/faa107training\.org"\)/);
  assert.match(layout, /openGraph:\s*\{/);
  assert.match(layout, /twitter:\s*\{/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(layout, /apple-touch-icon\.png/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(layout, /themeColor:\s*"#f59e0b"/);

  for (const page of [
    "app/page.tsx",
    "app/modules/page.tsx",
    "app/exam/page.tsx",
    "app/cram-sheet/page.tsx",
    "app/study-plan/page.tsx",
    "app/about/page.tsx",
  ]) {
    assert.match(read(page), /export const metadata:\s*Metadata\s*=/, `${page} missing metadata`);
  }
});

test("safe-area CSS covers the mobile header, desktop sidebar, and content bottom", () => {
  const shell = read("components/app-shell.tsx");
  const css = read("app/globals.css");

  assert.match(shell, /app-desktop-sidebar/);
  assert.match(shell, /app-mobile-header/);
  assert.match(shell, /app-main-content/);
  assert.match(css, /\.app-mobile-header[\s\S]*env\(safe-area-inset-top\)/);
  assert.match(css, /\.app-desktop-sidebar[\s\S]*env\(safe-area-inset-left\)/);
  assert.match(css, /\.app-main-content[\s\S]*env\(safe-area-inset-bottom\)/);
});
