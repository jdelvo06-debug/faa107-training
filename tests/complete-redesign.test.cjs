const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function rgb(hex) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("one Modern Flight School shell owns every production route", () => {
  const appShell = read("components/app-shell.tsx");

  assert.match(appShell, /return <ModernFlightSchoolShell>\{children\}<\/ModernFlightSchoolShell>/);
  assert.doesNotMatch(appShell, /usesModernFlightSchool/);
  assert.doesNotMatch(appShell, /app-desktop-sidebar/);
  assert.doesNotMatch(appShell, /ModuleNav/);
});

test("the consolidated shell exposes every important route without the old module sidebar", () => {
  const shell = read("components/modern-flight-school-shell.tsx");

  for (const href of ["/", "/modules", "/flashcards", "/exam", "/dashboard", "/study-plan", "/cram-sheet", "/resources", "/about"]) {
    assert.match(shell, new RegExp(`href: "${href.replaceAll("/", "\\/")}"`));
  }
  assert.doesNotMatch(shell, /ModuleNav/);
});

test("warm scoped shadcn variables replace the old dark component defaults", () => {
  const styles = read("components/modern-flight-school.module.css");

  for (const variable of [
    "--background", "--foreground", "--card", "--card-foreground", "--border",
    "--muted", "--muted-foreground", "--accent", "--accent-foreground",
    "--secondary", "--secondary-foreground", "--popover", "--popover-foreground",
    "--primary", "--primary-foreground", "--ring",
  ]) {
    assert.match(styles, new RegExp(`${variable}:`), `${variable} should be scoped to the flight shell`);
  }
  assert.match(styles, /:global\(\.bg-aviation-panel\)/);
  assert.match(styles, /:global\(\.text-slate-200\)/);
  assert.match(styles, /:global\(\.border-white\\\/10\)/);
});

test("approved coral, eyebrow, blue, and button combinations pass WCAG AA", () => {
  const styles = read("components/modern-flight-school.module.css");
  assert.match(styles, /--flight-coral: #b83a1a;/);
  assert.match(styles, /--flight-blue: #155e8e;/);

  assert.ok(contrast("#ffffff", "#b83a1a") >= 4.5, "white on coral must pass AA");
  assert.ok(contrast("#b83a1a", "#fffdf8") >= 4.5, "eyebrow coral on paper must pass AA");
  assert.ok(contrast("#155e8e", "#fffdf8") >= 4.5, "blue links on paper must pass AA");
});

test("the modern shell covers iPhone safe areas and collapses its full nav before crowding", () => {
  const styles = read("components/modern-flight-school.module.css");

  assert.match(styles, /env\(safe-area-inset-top\)/);
  assert.match(styles, /env\(safe-area-inset-right\)/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /env\(safe-area-inset-left\)/);
  assert.match(styles, /@media \(max-width: 1180px\)/);
});

test("the unanswered-submit dialog uses the warm portal-safe theme", () => {
  const exam = read("components/practice-exam.tsx");
  const styles = read("components/modern-flight-school.module.css");

  assert.match(exam, /styles\.examDialogOverlay/);
  assert.match(exam, /styles\.examDialogContent/);
  assert.match(exam, /styles\.examDialogTitle/);
  assert.match(exam, /styles\.examDialogDescription/);
  assert.match(styles, /\.examDialogContent\s*\{/);
  assert.match(
    styles,
    /\.examDialogContent\s*\{[\s\S]*?--flight-paper:\s*#fffdf8;[\s\S]*?--flight-teal:\s*#0a4642;[\s\S]*?--flight-line:/,
    "the portaled dialog must define the warm tokens it consumes",
  );
  assert.doesNotMatch(exam, /bg-aviation-panel/);
});

test("every previously dark route opts into the shared warm course surface", () => {
  const files = [
    "app/modules/page.tsx",
    "components/slide-viewer.tsx",
    "components/quiz-engine.tsx",
    "components/flashcard-deck.tsx",
    "app/cram-sheet/page.tsx",
    "components/study-plan.tsx",
    "app/resources/page.tsx",
    "app/about/page.tsx",
  ];

  for (const file of files) {
    const source = read(file);
    assert.match(source, /modern-flight-school\.module\.css/, `${file} should import the approved theme`);
    assert.match(source, /styles\.coursePage/, `${file} should use the shared course-page surface`);
  }
});

test("PWA theme color and design-lab divergence note match the completed redesign", () => {
  assert.match(read("app/layout.tsx"), /themeColor: "#b83a1a"/);
  assert.match(read("app/manifest.ts"), /background_color: "#fbf7ee"/);
  assert.match(read("app/manifest.ts"), /theme_color: "#b83a1a"/);
  assert.match(read("design-qa.md"), /Dashboard prototype divergence:/);
});
