const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function renderDashboard({ user, loading, resetProgress }) {
  const source = read("components/dashboard-summary.tsx");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const stateSlots = [];
  let hookIndex = 0;
  const confirmations = [];
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    confirm(message) {
      confirmations.push(message);
      return true;
    },
  } });

  const react = {
    useState(initialValue) {
      const index = hookIndex++;
      if (!(index in stateSlots)) stateSlots[index] = initialValue;
      return [stateSlots[index], (value) => {
        stateSlots[index] = typeof value === "function" ? value(stateSlots[index]) : value;
      }];
    },
  };
  const progress = {
    version: 1,
    modules: {},
    quizAttempts: [],
    flashcards: {},
    examAttempts: [],
    recentActivity: [],
  };
  const mockRequire = (specifier) => {
    if (specifier === "react") return react;
    if (specifier === "react/jsx-runtime") {
      return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    }
    if (specifier === "next/link") return "Link";
    if (specifier === "lucide-react") {
      return new Proxy({}, { get: (_target, key) => String(key) });
    }
    if (specifier === "@/components/auth-provider") {
      return { useAuth: () => ({ user, loading, resetProgress }) };
    }
    if (specifier === "@/lib/course-data") return { modules: [] };
    if (specifier === "@/lib/progress-selectors") {
      return {
        getFlashcardTotals: () => ({ reviewed: 0, total: 0 }),
        getOverallProgress: () => 0,
        getResumeTarget: () => ({ href: "/modules/1", label: "Start Module 1" }),
        getTopicModuleHref: () => "/modules",
        getWeakAreas: () => [],
      };
    }
    if (specifier === "@/lib/progress-storage") return { useProgress: () => progress };
    if (specifier === "./modern-flight-school.module.css") {
      return {
        __esModule: true,
        default: new Proxy({}, { get: (_target, key) => String(key) }),
      };
    }
    throw new Error(`Unexpected dashboard dependency: ${specifier}`);
  };
  const module = { exports: {} };
  Function("require", "module", "exports", compiled)(mockRequire, module, module.exports);

  function findNode(node, predicate) {
    if (Array.isArray(node)) {
      for (const child of node) {
        const match = findNode(child, predicate);
        if (match) return match;
      }
      return null;
    }
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    return findNode(node.props?.children, predicate);
  }

  function textContent(node) {
    if (Array.isArray(node)) return node.map(textContent).join("");
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (typeof node !== "object") return String(node);
    return textContent(node.props?.children);
  }

  function render() {
    hookIndex = 0;
    return module.exports.DashboardSummary();
  }

  return {
    confirmations,
    findResetButton(tree = render()) {
      return findNode(tree, (node) => node.type === "button" && node.props.className === "resetButton");
    },
    findResetStatus(tree = render()) {
      return findNode(tree, (node) => node.props?.className === "resetStatus");
    },
    render,
    restore() {
      if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
      else delete globalThis.window;
    },
    textContent,
  };
}

function mountAuthProvider() {
  const source = read("components/auth-provider.tsx");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const lookup = deferred();
  const authChanges = [];
  const tokenChanges = [];
  const stateSlots = [];
  const refSlots = [];
  const effects = [];
  const listeners = new Map();
  let hookIndex = 0;
  let authListener = null;
  let disposed = false;
  let unsubscribed = false;
  let resetCalls = 0;
  let localResetCalls = 0;
  let renderedProvider;

  const coordinator = {
    authChanged(user) {
      authChanges.push(user?.id ?? null);
      return Promise.resolve();
    },
    authTokenChanged(token) {
      tokenChanges.push(token);
      return Promise.resolve();
    },
    localWrite() {},
    reset() {
      resetCalls += 1;
      return Promise.resolve();
    },
    flush() { return Promise.resolve(); },
    subscribe(listener) {
      listener({ status: "idle", userId: null, message: null });
      return () => {};
    },
    dispose() { disposed = true; },
  };
  const supabase = {
    auth: {
      getUser() { return lookup.promise; },
      onAuthStateChange(listener) {
        authListener = listener;
        return { data: { subscription: { unsubscribe() { unsubscribed = true; } } } };
      },
      async signOut() { return { error: null }; },
    },
  };
  const react = {
    createContext(defaultValue) {
      return { defaultValue, Provider: Symbol("Provider") };
    },
    useContext(context) { return context.defaultValue; },
    useState(initialValue) {
      const index = hookIndex++;
      if (!(index in stateSlots)) {
        stateSlots[index] = typeof initialValue === "function" ? initialValue() : initialValue;
      }
      return [stateSlots[index], (value) => {
        stateSlots[index] = typeof value === "function" ? value(stateSlots[index]) : value;
      }];
    },
    useRef(initialValue) {
      const index = hookIndex++;
      if (!refSlots[index]) refSlots[index] = { current: initialValue };
      return refSlots[index];
    },
    useEffect(effect) { effects.push(effect); },
  };
  const mockRequire = (specifier) => {
    if (specifier === "react") return react;
    if (specifier === "react/jsx-runtime") {
      return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    }
    if (specifier === "next/navigation") return { useRouter: () => ({ refresh() {} }) };
    if (specifier === "@/lib/supabase/client") return { createClient: () => supabase };
    if (specifier === "@/lib/progress-rpc") return { createProgressRpcAdapter: () => ({}) };
    if (specifier === "@/lib/progress-sync") return { createProgressSyncCoordinator: () => coordinator };
    if (specifier === "@/lib/progress-storage") {
      return {
        resetProgress() { localResetCalls += 1; },
        setProgressOwner() {},
        subscribeProgressWrites: () => () => {},
      };
    }
    throw new Error(`Unexpected provider dependency: ${specifier}`);
  };

  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const storage = new Map();
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    addEventListener(type, listener) { listeners.set(`window:${type}`, listener); },
    removeEventListener(type) { listeners.delete(`window:${type}`); },
    dispatchEvent() {},
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    visibilityState: "visible",
    addEventListener(type, listener) { listeners.set(`document:${type}`, listener); },
    removeEventListener(type) { listeners.delete(`document:${type}`); },
  } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: null } });

  const module = { exports: {} };
  Function("require", "module", "exports", compiled)(mockRequire, module, module.exports);
  function render() {
    hookIndex = 0;
    renderedProvider = module.exports.AuthProvider({ children: "content" });
    return renderedProvider;
  }
  render();
  assert.equal(effects.length, 1);
  const cleanupEffect = effects[0]();

  function restoreGlobal(name, descriptor) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }

  return {
    authChanges,
    tokenChanges,
    lookup,
    emitAuth(user, accessToken = "token") {
      assert.ok(authListener);
      authListener("SIGNED_IN", { user, access_token: accessToken });
    },
    get user() { return stateSlots[1]; },
    get loading() { return stateSlots[2]; },
    get context() { return renderedProvider.props.value; },
    get disposed() { return disposed; },
    get localResetCalls() { return localResetCalls; },
    get resetCalls() { return resetCalls; },
    get unsubscribed() { return unsubscribed; },
    render,
    unmount() {
      cleanupEffect();
      restoreGlobal("window", originalWindow);
      restoreGlobal("document", originalDocument);
      restoreGlobal("navigator", originalNavigator);
    },
  };
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

test("auth provider exposes user state, progress sync, reset, and sign out to the application shell", () => {
  const provider = read("components/auth-provider.tsx");
  const layout = read("app/layout.tsx");
  const shell = read("components/modern-flight-school-shell.tsx");

  assert.match(provider, /onAuthStateChange/);
  assert.match(provider, /createProgressSyncCoordinator/);
  assert.match(provider, /authTokenChanged/);
  assert.match(provider, /subscribeProgressWrites/);
  assert.match(provider, /visibilitychange/);
  assert.match(provider, /pagehide/);
  assert.match(provider, /online/);
  assert.match(provider, /focus/);
  assert.match(provider, /progressSync/);
  assert.match(provider, /resetProgress/);
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

test("auth context reset uses the coordinator for a signed-in learner and stays local for an anonymous learner", async () => {
  const signedIn = mountAuthProvider();
  const user = { id: "11111111-1111-4111-8111-111111111111" };
  signedIn.lookup.resolve({ data: { user } });
  await flushPromises();
  signedIn.render();

  assert.equal(signedIn.context.progressSync.status, "idle");
  await signedIn.context.resetProgress();
  assert.equal(signedIn.resetCalls, 1);
  assert.equal(signedIn.localResetCalls, 0);
  signedIn.unmount();

  const anonymous = mountAuthProvider();
  anonymous.lookup.resolve({ data: { user: null } });
  await flushPromises();
  anonymous.render();
  await anonymous.context.resetProgress();
  assert.equal(anonymous.resetCalls, 0);
  assert.equal(anonymous.localResetCalls, 1);
  anonymous.unmount();
});

test("auth context rejects reset while identity is unresolved without touching either reset path", async () => {
  const unresolved = mountAuthProvider();

  assert.equal(unresolved.loading, true);
  await assert.rejects(unresolved.context.resetProgress(), /account status is still loading/i);
  assert.equal(unresolved.resetCalls, 0);
  assert.equal(unresolved.localResetCalls, 0);
  unresolved.unmount();
});

test("authenticated progress sync status is compact, polite, and uses exact truthful copy", () => {
  const shell = read("components/modern-flight-school-shell.tsx");

  for (const copy of [
    "Saving progress…",
    "Progress synced",
    "Saved locally — sync pending",
    "Update required to sync progress",
  ]) {
    assert.match(shell, new RegExp(copy));
  }
  assert.match(shell, /user \? \([\s\S]*?role="status"[\s\S]*?aria-live="polite"/);
  assert.doesNotMatch(shell, /toast|dialog|modal/i);
});

test("dashboard reset distinguishes account-wide RPC reset from browser-only anonymous reset", async () => {
  const dashboard = read("components/dashboard-summary.tsx");

  assert.match(dashboard, /Reset progress\? This removes saved progress from this account across devices\. This cannot be undone\./);
  assert.match(dashboard, /Reset progress\? This removes saved progress from this browser only\. This cannot be undone\./);
  assert.match(dashboard, /await resetProgress\(\)/);
  assert.match(dashboard, /disabled=\{loading \|\| resetting\}/);
  assert.match(dashboard, /Checking account…/);
  assert.match(dashboard, /Resetting progress…/);
  assert.match(dashboard, /Reset failed\. Your progress was not changed\. Please try again\./);
  assert.match(dashboard, /aria-live="polite"/);

  let signedInResets = 0;
  const signedIn = renderDashboard({
    user: { id: "11111111-1111-4111-8111-111111111111" },
    loading: false,
    async resetProgress() { signedInResets += 1; },
  });
  await signedIn.findResetButton().props.onClick();
  assert.deepEqual(signedIn.confirmations, [
    "Reset progress? This removes saved progress from this account across devices. This cannot be undone.",
  ]);
  assert.equal(signedInResets, 1);
  signedIn.restore();

  let anonymousResets = 0;
  const anonymous = renderDashboard({
    user: null,
    loading: false,
    async resetProgress() { anonymousResets += 1; },
  });
  await anonymous.findResetButton().props.onClick();
  assert.deepEqual(anonymous.confirmations, [
    "Reset progress? This removes saved progress from this browser only. This cannot be undone.",
  ]);
  assert.equal(anonymousResets, 1);
  anonymous.restore();
});

test("dashboard reset stays inert while auth is unresolved and preserves pending and failure states", async () => {
  let unresolvedResets = 0;
  const unresolved = renderDashboard({
    user: null,
    loading: true,
    async resetProgress() { unresolvedResets += 1; },
  });
  const unresolvedButton = unresolved.findResetButton();
  assert.equal(unresolvedButton.props.disabled, true);
  assert.match(unresolved.textContent(unresolvedButton), /Checking account…/);
  await unresolvedButton.props.onClick();
  assert.deepEqual(unresolved.confirmations, []);
  assert.equal(unresolvedResets, 0);
  unresolved.restore();

  const pendingReset = deferred();
  const failure = renderDashboard({
    user: { id: "11111111-1111-4111-8111-111111111111" },
    loading: false,
    resetProgress: () => pendingReset.promise,
  });
  const resetAttempt = failure.findResetButton().props.onClick();
  const pendingButton = failure.findResetButton();
  assert.equal(pendingButton.props.disabled, true);
  assert.match(failure.textContent(pendingButton), /Resetting progress…/);
  pendingReset.reject(new Error("offline"));
  await resetAttempt;
  assert.match(
    failure.textContent(failure.findResetStatus()),
    /Reset failed\. Your progress was not changed\. Please try again\./,
  );
  failure.restore();
});

test("a newer auth event prevents a deferred initial user from reactivating the old owner", async () => {
  const provider = mountAuthProvider();
  const userA = { id: "11111111-1111-4111-8111-111111111111" };
  const userB = { id: "22222222-2222-4222-8222-222222222222" };
  provider.emitAuth(userB, "token-b");
  await flushPromises();
  provider.lookup.resolve({ data: { user: userA } });
  await flushPromises();

  assert.equal(provider.user, userB);
  assert.equal(provider.loading, false);
  assert.deepEqual(provider.authChanges, [userB.id]);
  assert.deepEqual(provider.tokenChanges, ["token-b"]);
  provider.unmount();
});

test("unmount invalidates a deferred initial user lookup", async () => {
  const provider = mountAuthProvider();
  const userA = { id: "11111111-1111-4111-8111-111111111111" };
  provider.unmount();
  provider.lookup.resolve({ data: { user: userA } });
  await flushPromises();

  assert.equal(provider.user, null);
  assert.equal(provider.loading, true);
  assert.deepEqual(provider.authChanges, []);
  assert.equal(provider.disposed, true);
  assert.equal(provider.unsubscribed, true);
});

test("initial user discovery initializes the provider when no auth event supersedes it", async () => {
  const provider = mountAuthProvider();
  const userA = { id: "11111111-1111-4111-8111-111111111111" };
  provider.lookup.resolve({ data: { user: userA } });
  await flushPromises();

  assert.equal(provider.user, userA);
  assert.equal(provider.loading, false);
  assert.deepEqual(provider.authChanges, [userA.id]);
  provider.unmount();
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
  assert.match(dashboard, /Learning progress still works locally without an account\./);
  assert.doesNotMatch(dashboard, /when progress sync becomes available/i);
  assert.match(dashboard, /href="\/login"/);
  assert.match(dashboard, /useProgress\(\)/);
  assert.match(progressStorage, /localStorage/);
});
