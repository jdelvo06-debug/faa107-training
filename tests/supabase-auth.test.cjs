const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadCallbackRoute(exchangeResult = { error: null }) {
  const source = read("app/auth/callback/route.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exchangeCalls = [];
  const module = { exports: {} };

  const mockRequire = (specifier) => {
    if (specifier === "next/server") {
      return {
        NextResponse: {
          redirect(url) {
            return Response.redirect(String(url), 307);
          },
        },
      };
    }
    if (specifier === "@/lib/supabase/server") {
      return {
        createClient() {
          return {
            auth: {
              async exchangeCodeForSession(code) {
                exchangeCalls.push(code);
                return exchangeResult;
              },
            },
          };
        },
      };
    }
    throw new Error(`Unexpected callback dependency: ${specifier}`);
  };

  Function("require", "module", "exports", compiled)(mockRequire, module, module.exports);
  return { GET: module.exports.GET, exchangeCalls };
}

async function runCallback({
  origin = "https://faa107training.org",
  code = "valid-code",
  next,
  headers,
  exchangeResult,
} = {}) {
  const url = new URL("/auth/callback", origin);
  if (code !== null) url.searchParams.set("code", code);
  if (next !== undefined) url.searchParams.set("next", next);
  const route = loadCallbackRoute(exchangeResult);
  const response = await route.GET(new Request(url, { headers }));
  return {
    exchangeCalls: route.exchangeCalls,
    location: response.headers.get("location"),
    status: response.status,
  };
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

test("auth callback keeps successful redirects on each approved origin", async () => {
  for (const origin of [
    "https://faa107training.org",
    "https://faa107-training.vercel.app",
    "http://localhost:3000",
  ]) {
    const result = await runCallback({ origin, next: "/dashboard?source=oauth" });
    assert.equal(result.status, 307);
    assert.equal(result.location, `${origin}/dashboard?source=oauth`);
    assert.deepEqual(result.exchangeCalls, ["valid-code"]);
  }
});

test("auth callback rejects absolute and protocol-relative next targets", async () => {
  for (const next of ["https://attacker.example/steal", "//attacker.example/steal"]) {
    const result = await runCallback({
      origin: "https://faa107-training.vercel.app",
      next,
    });
    assert.equal(result.location, "https://faa107-training.vercel.app/dashboard");
  }
});

test("host headers and unapproved request origins cannot select a redirect origin", async () => {
  const hostileHeaders = {
    host: "attacker.example",
    "x-forwarded-host": "attacker.example",
  };
  const approvedRequest = await runCallback({ headers: hostileHeaders });
  const unapprovedRequest = await runCallback({
    origin: "https://attacker.example",
    headers: hostileHeaders,
  });

  assert.equal(approvedRequest.location, "https://faa107training.org/dashboard");
  assert.equal(unapprovedRequest.location, "https://faa107training.org/dashboard");
});

test("missing codes and failed exchanges use the same-origin auth error route", async () => {
  const missingCode = await runCallback({ code: null });
  const failedExchange = await runCallback({
    origin: "https://faa107-training.vercel.app",
    exchangeResult: { error: new Error("invalid code") },
  });

  assert.deepEqual(missingCode.exchangeCalls, []);
  assert.equal(missingCode.location, "https://faa107training.org/auth/auth-code-error");
  assert.deepEqual(failedExchange.exchangeCalls, ["valid-code"]);
  assert.equal(failedExchange.location, "https://faa107-training.vercel.app/auth/auth-code-error");
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

test("auth actions recover from unexpected throws and always reset submission state", () => {
  const form = read("components/auth-form.tsx");

  assert.match(form, /AUTH_RETRY_MESSAGE/);
  assert.equal((form.match(/catch \{/g) ?? []).length, 2);
  assert.equal((form.match(/finally \{/g) ?? []).length, 2);
  assert.equal((form.match(/setSubmitting\(false\)/g) ?? []).length, 2);
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
