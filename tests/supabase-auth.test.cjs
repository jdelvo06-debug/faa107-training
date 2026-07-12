const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Supabase clients use only public environment variables and cookie SSR", () => {
  const browserClient = read("lib/supabase/client.ts");
  const serverClient = read("lib/supabase/server.ts");
  const middlewareClient = read("lib/supabase/middleware.ts");
  const envExample = read(".env.local.example");

  for (const source of [browserClient, serverClient, middlewareClient]) {
    assert.match(source, /NEXT_PUBLIC_SUPABASE_URL/);
    assert.match(source, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    assert.doesNotMatch(source, /service.?role/i);
  }

  assert.match(browserClient, /createBrowserClient/);
  assert.match(serverClient, /createServerClient/);
  assert.match(serverClient, /cookies\(\)/);
  assert.match(middlewareClient, /getUser\(\)/);
  assert.match(middlewareClient, /request\.cookies\.getAll\(\)/);
  assert.deepEqual(
    envExample.trim().split("\n").map((line) => line.split("=")[0]),
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  );
});

test("session middleware refreshes cookies without gating public routes", () => {
  const middleware = read("middleware.ts");
  const sessionUpdater = read("lib/supabase/middleware.ts");

  assert.match(middleware, /updateSession\(request\)/);
  assert.match(middleware, /_next\/static/);
  assert.doesNotMatch(middleware, /redirect\(/);
  assert.doesNotMatch(sessionUpdater, /\/login/);
});

test("auth callback exchanges PKCE codes and rejects unsafe next targets", () => {
  const callback = read("app/auth/callback/route.ts");

  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /requestedNext\.startsWith\("\/"\)/);
  assert.match(callback, /!requestedNext\.startsWith\("\/\/"\)/);
  assert.match(callback, /auth\/auth-code-error/);
});

test("auth provider exposes user state and sign out to the application shell", () => {
  const provider = read("components/auth-provider.tsx");
  const layout = read("app/layout.tsx");
  const shell = read("components/modern-flight-school-shell.tsx");

  assert.match(provider, /onAuthStateChange/);
  assert.match(provider, /signOut/);
  assert.match(provider, /\.catch\(\(\) => \{[\s\S]*setLoading\(false\)/);
  assert.match(layout, /<AuthProvider>/);
  assert.match(shell, /useAuth\(\)/);
  assert.match(shell, /Log in/);
  assert.match(shell, /Sign up/);
  assert.match(shell, /Sign out/);
  assert.match(shell, /authControlsDesktop/);
  assert.match(shell, /authControlsMobile/);
});

test("login and signup support email-password and Google without Apple", () => {
  const login = read("app/login/page.tsx");
  const signup = read("app/signup/page.tsx");
  const form = read("components/auth-form.tsx");
  const combined = `${login}\n${signup}\n${form}`;

  assert.match(login, /mode="login"/);
  assert.match(signup, /mode="signup"/);
  assert.match(form, /signInWithPassword/);
  assert.match(form, /signUp/);
  assert.match(form, /Confirm password/);
  assert.match(form, /Check your email/);
  assert.match(combined, /signInWithOAuth/);
  assert.match(combined, /provider: "google"/);
  assert.match(combined, /\/auth\/callback/);
  assert.doesNotMatch(combined, /apple/i);
  assert.match(combined, /aria-live="polite"/);
});

test("logged-out dashboard sync prompt is non-blocking and leaves progress storage intact", () => {
  const dashboard = read("components/dashboard-summary.tsx");
  const progressStorage = read("lib/progress-storage.ts");

  assert.match(dashboard, /useAuth\(\)/);
  assert.match(dashboard, /sync your progress across devices/i);
  assert.match(dashboard, /href="\/login"/);
  assert.match(dashboard, /useProgress\(\)/);
  assert.match(progressStorage, /localStorage/);
});
