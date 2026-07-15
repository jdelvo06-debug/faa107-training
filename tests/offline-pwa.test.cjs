const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { pathToFileURL } = require("node:url");
const {
  unstable_getResponseFromNextConfig,
} = require("next/experimental/testing/server");

const root = path.resolve(__dirname, "..");
const applicationOrigin = "https://faa107training.org";
const workerPath = path.join(root, "public/sw.js");
const offlinePath = path.join(root, "public/offline.html");

function requestFor(relativeOrAbsoluteUrl, overrides = {}) {
  const url = new URL(relativeOrAbsoluteUrl, applicationOrigin).href;
  return {
    url,
    method: "GET",
    mode: "navigate",
    destination: "document",
    headers: new Headers(),
    ...overrides,
  };
}

function responseFor(body, request, overrides = {}) {
  const response = new Response(body, {
    status: overrides.status ?? 200,
    headers: {
      "content-type": overrides.contentType ?? "text/html; charset=utf-8",
      ...(overrides.headers ?? {}),
    },
  });
  Object.defineProperties(response, {
    type: { configurable: true, value: overrides.type ?? "basic" },
    redirected: { configurable: true, value: overrides.redirected ?? false },
    url: { configurable: true, value: overrides.url ?? request.url },
  });
  return response;
}

function cloneCachedResponse(response) {
  const clone = response.clone();
  Object.defineProperties(clone, {
    type: { configurable: true, value: response.type },
    redirected: { configurable: true, value: response.redirected },
    url: { configurable: true, value: response.url },
  });
  return clone;
}

class MemoryCache {
  constructor(origin, offlineDocument) {
    this.origin = origin;
    this.offlineDocument = offlineDocument;
    this.entries = new Map();
    this.puts = [];
  }

  key(request) {
    const value = typeof request === "string" ? request : request.url;
    return new URL(value, this.origin).href;
  }

  async addAll(urls) {
    for (const url of urls) {
      const request = requestFor(url);
      const body = new URL(request.url).pathname === "/offline.html"
        ? this.offlineDocument
        : `precache:${request.url}`;
      const response = responseFor(body, request);
      await this.put(request, response);
    }
  }

  async match(request) {
    const response = this.entries.get(this.key(request));
    return response ? cloneCachedResponse(response) : undefined;
  }

  async delete(request) {
    return this.entries.delete(this.key(request));
  }

  async put(request, response) {
    this.puts.push(this.key(request));
    const stored = cloneCachedResponse(response);
    Object.defineProperties(stored, {
      type: { configurable: true, value: response.type === "default" ? "basic" : response.type },
      url: { configurable: true, value: response.url || this.key(request) },
    });
    this.entries.set(this.key(request), stored);
  }
}

class MemoryCacheStorage {
  constructor(origin, offlineDocument) {
    this.origin = origin;
    this.offlineDocument = offlineDocument;
    this.stores = new Map();
    this.deleted = [];
  }

  async open(name) {
    if (!this.stores.has(name)) {
      this.stores.set(name, new MemoryCache(this.origin, this.offlineDocument));
    }
    return this.stores.get(name);
  }

  async keys() {
    return [...this.stores.keys()];
  }

  async delete(name) {
    this.deleted.push(name);
    return this.stores.delete(name);
  }

  async match(request) {
    for (const cache of this.stores.values()) {
      const response = await cache.match(request);
      if (response) return response;
    }
    return undefined;
  }
}

function createWorkerHarness() {
  assert.equal(fs.existsSync(workerPath), true, "public/sw.js must implement the offline worker");
  assert.equal(fs.existsSync(offlinePath), true, "public/offline.html must provide the fallback document");

  const listeners = new Map();
  const calls = {
    claim: 0,
    fetch: [],
    skipWaiting: 0,
  };
  const caches = new MemoryCacheStorage(
    applicationOrigin,
    fs.readFileSync(offlinePath, "utf8"),
  );
  let network = async (request) => responseFor(`network:${request.url}`, request);
  const self = {
    location: new URL(applicationOrigin),
    addEventListener(type, listener) {
      const current = listeners.get(type) ?? [];
      current.push(listener);
      listeners.set(type, current);
    },
    skipWaiting() {
      calls.skipWaiting += 1;
      return Promise.resolve();
    },
    clients: {
      claim() {
        calls.claim += 1;
        return Promise.resolve();
      },
    },
  };

  const context = vm.createContext({
    self,
    caches,
    fetch(request) {
      calls.fetch.push(request.url ?? String(request));
      return network(request);
    },
    URL,
    Request,
    Response,
    Headers,
    Promise,
    console,
  });
  vm.runInContext(fs.readFileSync(workerPath, "utf8"), context, { filename: workerPath });

  return {
    caches,
    calls,
    async dispatch(type, properties = {}) {
      const waits = [];
      const event = {
        waitUntil(promise) {
          waits.push(Promise.resolve(promise));
        },
        ...properties,
      };
      for (const listener of listeners.get(type) ?? []) listener(event);
      await Promise.all(waits);
      return event;
    },
    async dispatchFetch(request) {
      let responsePromise = null;
      const event = {
        request,
        respondWith(promise) {
          assert.equal(responsePromise, null, "fetch may only be handled once");
          responsePromise = Promise.resolve(promise);
        },
      };
      for (const listener of listeners.get("fetch") ?? []) listener(event);
      return {
        responded: responsePromise !== null,
        response: responsePromise ? await responsePromise : null,
      };
    },
    setNetwork(nextNetwork) {
      network = nextNetwork;
    },
  };
}

function loadRegistrationHarness(pathname, options = {}) {
  const componentPath = path.join(root, "components/service-worker-registration.tsx");
  assert.equal(
    fs.existsSync(componentPath),
    true,
    "components/service-worker-registration.tsx must register the worker client-side",
  );
  const source = fs.readFileSync(componentPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: componentPath,
  }).outputText;

  const effects = [];
  const stateSlots = [];
  const windowListeners = new Map();
  const registrationListeners = new Map();
  const registerCalls = [];
  const warmMessages = [];
  let hookIndex = 0;
  const activeWorker = {
    postMessage(message) {
      warmMessages.push(message);
    },
  };
  const registration = {
    active: activeWorker,
    waiting: options.waiting ? { postMessage() { throw new Error("waiting worker must not be forced active"); } } : null,
    installing: null,
    addEventListener(type, listener) {
      registrationListeners.set(type, listener);
    },
    removeEventListener(type) {
      registrationListeners.delete(type);
    },
  };
  const serviceWorker = {
    controller: options.controller ?? null,
    ready: Promise.resolve(registration),
    async register(...args) {
      registerCalls.push(args);
      return registration;
    },
  };
  const react = {
    useEffect(effect) {
      effects.push(effect);
    },
    useState(initialValue) {
      const index = hookIndex++;
      if (!(index in stateSlots)) stateSlots[index] = initialValue;
      return [stateSlots[index], (value) => {
        stateSlots[index] = typeof value === "function" ? value(stateSlots[index]) : value;
      }];
    },
  };
  const mockRequire = (specifier) => {
    if (specifier === "react") return react;
    if (specifier === "react/jsx-runtime") {
      return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    }
    if (specifier === "next/navigation") return { usePathname: () => pathname };
    throw new Error(`Unexpected registration dependency: ${specifier}`);
  };

  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalNodeEnv = process.env.NODE_ENV;
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    isSecureContext: options.secureContext ?? true,
    location: {
      href: new URL(pathname, applicationOrigin).href,
      origin: applicationOrigin,
      pathname,
    },
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    removeEventListener(type) { windowListeners.delete(type); },
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    readyState: options.readyState ?? "complete",
    scripts: (options.attachedAssets?.scripts ?? []).map((src) => ({ src })),
    styleSheets: (options.attachedAssets?.styles ?? []).map((href) => ({ href })),
    images: (options.attachedAssets?.images ?? []).map((src) => ({ currentSrc: src, src })),
  } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    ...(options.supported === false ? {} : { serviceWorker }),
  } });
  process.env.NODE_ENV = "production";

  const loaded = { exports: {} };
  Function("require", "module", "exports", output)(mockRequire, loaded, loaded.exports);

  function render() {
    hookIndex = 0;
    return loaded.exports.ServiceWorkerRegistration();
  }

  function restoreGlobal(name, descriptor) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }

  return {
    effects,
    registerCalls,
    registration,
    registrationListeners,
    render,
    async runEffect() {
      assert.ok(effects.length >= 1);
      const cleanups = effects.map((effect) => effect());
      await new Promise((resolve) => setImmediate(resolve));
      return () => cleanups.forEach((cleanup) => cleanup?.());
    },
    async fireWindowLoad() {
      windowListeners.get("load")?.();
      await new Promise((resolve) => setImmediate(resolve));
    },
    restore() {
      restoreGlobal("window", originalWindow);
      restoreGlobal("document", originalDocument);
      restoreGlobal("navigator", originalNavigator);
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    },
    warmMessages,
  };
}

function textContent(node) {
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  return textContent(node.props?.children);
}

test("approved course navigations and same-origin course assets use the worker cache strategies", async () => {
  const harness = createWorkerHarness();
  const approved = [
    requestFor("/"),
    requestFor("/modules"),
    requestFor("/modules/1"),
    requestFor("/modules/1/quiz"),
    requestFor("/modules/1/flashcards"),
    requestFor("/_next/static/chunks/app.js", {
      mode: "cors",
      destination: "script",
      referrer: `${applicationOrigin}/modules/1`,
    }),
    requestFor("/_next/static/chunks/main-app-a1b2.js", {
      mode: "cors",
      destination: "script",
      referrer: `${applicationOrigin}/modules/1`,
    }),
    requestFor("/_next/static/css/course-a1b2.css", {
      mode: "cors",
      destination: "style",
      referrer: `${applicationOrigin}/modules/1`,
    }),
    requestFor("/_next/static/media/course-hero-a1b2.png", {
      mode: "cors",
      destination: "image",
      referrer: `${applicationOrigin}/modules/1`,
    }),
    requestFor("/_next/static/chunks/app/layout-a1b2.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/app/modules/%5Bid%5D/page-a1b2.js", { mode: "cors", destination: "script" }),
    requestFor("/images/charts/airspace-boundaries.png", { mode: "cors", destination: "image" }),
    requestFor("/_next/image?url=%2Fimages%2Fcharts%2Fairspace-boundaries.png&w=1200&q=75", {
      mode: "cors",
      destination: "image",
    }),
  ];

  for (const request of approved) {
    const result = await harness.dispatchFetch(request);
    assert.equal(result.responded, true, `${request.url} must use an approved cache strategy`);
    assert.equal(result.response.status, 200);
  }
  assert.equal(harness.calls.fetch.length, approved.length);
  assert.equal(
    [...harness.caches.stores.values()].some((cache) => cache.puts.includes(approved[2].url)),
    true,
    "successful module navigation must be cached",
  );
});

test("auth, account, API, Supabase, OAuth, FAA/eCFR, external, authorized, and non-GET requests bypass the worker", async () => {
  const harness = createWorkerHarness();
  const excluded = [
    requestFor("/login"),
    requestFor("/login/help"),
    requestFor("/signup"),
    requestFor("/auth/callback?code=secret&state=oauth-state"),
    requestFor("/auth/auth-code-error"),
    requestFor("/dashboard"),
    requestFor("/exam/results"),
    requestFor("/api/progress"),
    requestFor("https://qbeioesktbpvdlgzrgsm.supabase.co/rest/v1/progress"),
    requestFor("wss://qbeioesktbpvdlgzrgsm.supabase.co/realtime/v1/websocket"),
    requestFor("https://accounts.google.com/o/oauth2/v2/auth"),
    requestFor("https://www.faa.gov/uas/commercial_operators"),
    requestFor("https://www.ecfr.gov/current/title-14/part-107"),
    requestFor("/_next/image?url=https%3A%2F%2Fwww.faa.gov%2Fchart.png&w=1200&q=75", {
      mode: "cors",
      destination: "image",
    }),
    requestFor("/_next/static/chunks/app/login/page.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/app/signup/page.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/app/auth/auth-code-error/page.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/app/dashboard/page.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/app/exam/results/page.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/app/design-lab/page.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/app/future-account/page.js", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/main-app.js?session_state=oauth-state", { mode: "cors", destination: "script" }),
    requestFor("/_next/static/chunks/main-app.js?id_token=jwt-like-value", { mode: "cors", destination: "script" }),
    requestFor("/modules/1", { headers: new Headers({ authorization: "Bearer account-token" }) }),
    requestFor("/modules/1", { method: "POST" }),
  ];

  for (const request of excluded) {
    const result = await harness.dispatchFetch(request);
    assert.equal(result.responded, false, `${request.url} must remain network-only`);
  }
  assert.deepEqual(harness.calls.fetch, [], "bypassed requests must not be fetched by worker code");
});

test("generic Next assets pass through without caching unless declared by a warmed course document", async () => {
  const harness = createWorkerHarness();
  const authOnlyChunk = requestFor("/_next/static/chunks/6468-auth-only.js", {
    mode: "cors",
    destination: "script",
    referrer: `${applicationOrigin}/`,
  });
  const designOnlyCss = requestFor("/_next/static/css/design-lab-only.css", {
    mode: "cors",
    destination: "style",
    referrer: `${applicationOrigin}/design-lab`,
  });

  for (const request of [authOnlyChunk, designOnlyCss]) {
    const result = await harness.dispatchFetch(request);
    assert.equal(result.responded, true, "generic Next assets may pass through the worker");
    assert.equal(await result.response.text(), `network:${request.url}`);
  }
  const earlyAssetCache = [...harness.caches.stores.entries()]
    .find(([name]) => name.includes("-assets-"))?.[1];
  assert.equal(
    earlyAssetCache?.entries.size ?? 0,
    0,
    "route prefetches and non-course pages must not populate the asset cache",
  );

  const fetchCount = harness.calls.fetch.length;
  await harness.dispatch("message", {
    source: { url: `${applicationOrigin}/modules/1` },
    data: {
      type: "CACHE_PUBLIC_ASSETS",
      urls: [authOnlyChunk.url, designOnlyCss.url],
    },
  });
  assert.equal(
    harness.calls.fetch.length,
    fetchCount,
    "client messages must not nominate timing-dependent DOM or prefetch assets",
  );
  assert.equal(earlyAssetCache?.entries.size ?? 0, 0);
});

test("activation removes only stale FAA 107 cache versions without forcing worker takeover", async () => {
  const harness = createWorkerHarness();
  await harness.dispatch("install");
  await harness.dispatchFetch(requestFor("/modules/1"));
  await harness.dispatchFetch(requestFor("/_next/static/chunks/app/layout-a1b2.js", {
    mode: "cors",
    destination: "script",
  }));
  const current = await harness.caches.keys();
  assert.ok(current.length >= 3, "install and runtime strategies must create versioned caches");
  assert.equal(current.every((name) => name.startsWith("faa107-pwa-")), true);
  harness.caches.stores.set("faa107-pwa-pages-v0", new MemoryCache(applicationOrigin, ""));
  harness.caches.stores.set("faa107-pwa-assets-v0", new MemoryCache(applicationOrigin, ""));
  harness.caches.stores.set("another-app-cache", new MemoryCache(applicationOrigin, ""));

  await harness.dispatch("activate");

  const remaining = await harness.caches.keys();
  for (const name of current) assert.equal(remaining.includes(name), true, `${name} must remain current`);
  assert.equal(remaining.includes("another-app-cache"), true, "unrelated caches must be preserved");
  assert.equal(remaining.includes("faa107-pwa-pages-v0"), false);
  assert.equal(remaining.includes("faa107-pwa-assets-v0"), false);
  assert.equal(harness.calls.skipWaiting, 0, "install must not force a waiting update active");
  assert.equal(harness.calls.claim, 0, "activate must not immediately take over active study tabs");
});

test("navigation is network-first, reuses an exact cached course page, then falls back to deliberate offline guidance", async () => {
  const harness = createWorkerHarness();
  await harness.dispatch("install");
  const moduleRequest = requestFor("/modules/1");
  harness.setNetwork(async (request) => responseFor("visited module one", request));
  const online = await harness.dispatchFetch(moduleRequest);
  assert.equal(await online.response.text(), "visited module one");

  harness.setNetwork(async () => { throw new TypeError("Failed to fetch"); });
  const cached = await harness.dispatchFetch(moduleRequest);
  assert.equal(await cached.response.text(), "visited module one");

  const fallback = await harness.dispatchFetch(requestFor("/modules/2"));
  const fallbackHtml = await fallback.response.text();
  assert.match(fallbackHtml, /you(?:&rsquo;|')?re offline/i);
  assert.match(fallbackHtml, /login|authentication/i);
  assert.match(fallbackHtml, /account sync/i);
  assert.match(fallbackHtml, /href="\/modules"/i);
  assert.match(fallbackHtml, /cached|previously (?:opened|visited)/i);
});

test("Cache Storage failures never replace successful navigation or asset network responses", async () => {
  const openFailure = createWorkerHarness();
  openFailure.caches.open = async () => { throw new Error("QuotaExceededError"); };
  const navigation = await openFailure.dispatchFetch(requestFor("/modules/1"));
  assert.equal(await navigation.response.text(), "network:https://faa107training.org/modules/1");

  const putFailure = createWorkerHarness();
  const originalOpen = putFailure.caches.open.bind(putFailure.caches);
  putFailure.caches.open = async (name) => {
    const cache = await originalOpen(name);
    cache.put = async () => { throw new Error("QuotaExceededError"); };
    return cache;
  };
  const assetRequest = requestFor("/_next/static/chunks/app/layout-a1b2.js", {
    mode: "cors",
    destination: "script",
  });
  putFailure.setNetwork(async (request) => responseFor(`asset:${request.url}`, request, {
    contentType: "application/javascript",
  }));
  const asset = await putFailure.dispatchFetch(assetRequest);
  assert.equal(await asset.response.text(), `asset:${assetRequest.url}`);
});

test("an invalid cached navigation is retired and replaced by the deliberate offline fallback", async () => {
  const harness = createWorkerHarness();
  await harness.dispatch("install");
  await harness.dispatchFetch(requestFor("/modules/1"));
  const pageCache = [...harness.caches.stores.entries()]
    .find(([name]) => name.includes("-pages-"))?.[1];
  assert.ok(pageCache);
  const moduleRequest = requestFor("/modules/1");
  pageCache.entries.set(
    moduleRequest.url,
    responseFor('{"account":"not-course-html"}', moduleRequest, { contentType: "application/json" }),
  );
  harness.setNetwork(async () => { throw new TypeError("Failed to fetch"); });

  const result = await harness.dispatchFetch(moduleRequest);
  assert.match(await result.response.text(), /you(?:&rsquo;|')?re offline/i);
  assert.equal(pageCache.entries.has(moduleRequest.url), false, "invalid page entry must be retired");
});

test("the active worker safely warms an approved first-visit document without credentials", async () => {
  const harness = createWorkerHarness();
  const observed = [];
  harness.setNetwork(async (request) => {
    observed.push({ credentials: request.credentials, url: request.url });
    if (request.url === `${applicationOrigin}/modules/1`) {
      return responseFor(`<!doctype html>
        <link rel="stylesheet" href="/_next/static/css/course-shell.css">
        <script src="/_next/static/chunks/main-app-course.js"></script>
        <script src="/_next/static/chunks/app/modules/%5Bid%5D/page.js"></script>
        <script src="/_next/static/chunks/app/login/page.js"></script>
        <img src="https://www.faa.gov/chart.png" alt="External chart">
        <main>warmed module one</main>`, request);
    }
    return responseFor(`asset:${request.url}`, request, {
      contentType: request.url.endsWith(".css") ? "text/css" : "application/javascript",
    });
  });
  await harness.dispatch("message", {
    source: { url: `${applicationOrigin}/modules/1` },
    data: { type: "CACHE_PUBLIC_DOCUMENT", url: `${applicationOrigin}/modules/1` },
  });
  assert.deepEqual(observed, [
    { credentials: "omit", url: `${applicationOrigin}/modules/1` },
    { credentials: "omit", url: `${applicationOrigin}/_next/static/css/course-shell.css` },
    { credentials: "omit", url: `${applicationOrigin}/_next/static/chunks/main-app-course.js` },
    {
      credentials: "omit",
      url: `${applicationOrigin}/_next/static/chunks/app/modules/%5Bid%5D/page.js`,
    },
  ]);

  const assetCache = [...harness.caches.stores.entries()]
    .find(([name]) => name.includes("-assets-"))?.[1];
  assert.equal(assetCache?.entries.size, 3, "only assets declared by the public course document are warmed");

  harness.setNetwork(async () => { throw new TypeError("Failed to fetch"); });
  const cached = await harness.dispatchFetch(requestFor("/modules/1"));
  assert.match(await cached.response.text(), /warmed module one/);

  const fetchCount = harness.calls.fetch.length;
  for (const url of [
    `${applicationOrigin}/login`,
    `${applicationOrigin}/dashboard`,
    "https://www.faa.gov/uas/commercial_operators",
  ]) {
    await harness.dispatch("message", {
      source: { url: `${applicationOrigin}/modules/1` },
      data: { type: "CACHE_PUBLIC_DOCUMENT", url },
    });
  }
  await harness.dispatch("message", {
    source: { url: `${applicationOrigin}/login` },
    data: { type: "CACHE_PUBLIC_DOCUMENT", url: `${applicationOrigin}/modules/1` },
  });
  assert.equal(harness.calls.fetch.length, fetchCount, "unsafe warm requests must be ignored");
});

test("worker registration waits for the client effect and window load, then uses the stable root-scope contract", async () => {
  const harness = loadRegistrationHarness("/modules/1", { readyState: "loading" });
  try {
    assert.equal(harness.render(), null);
    assert.deepEqual(harness.registerCalls, [], "render and SSR must not register a worker");
    const cleanup = await harness.runEffect();
    assert.deepEqual(harness.registerCalls, [], "registration must wait for the first page load");
    await harness.fireWindowLoad();
    assert.deepEqual(harness.registerCalls, [["/sw.js", { scope: "/", updateViaCache: "none" }]]);
    assert.deepEqual(harness.warmMessages, [{
      type: "CACHE_PUBLIC_DOCUMENT",
      url: `${applicationOrigin}/modules/1`,
    }]);
    cleanup?.();
  } finally {
    harness.restore();
  }
});

test("registration never nominates timing-dependent DOM or prefetch assets", async () => {
  const sharedChunk = `${applicationOrigin}/_next/static/chunks/main-app-course.js`;
  const courseCss = `${applicationOrigin}/_next/static/css/course-shell.css`;
  const courseImage = `${applicationOrigin}/images/charts/airspace-boundaries.png`;
  const harness = loadRegistrationHarness("/modules/1", {
    attachedAssets: {
      scripts: [sharedChunk, sharedChunk, "", "https://accounts.google.com/oauth.js"],
      styles: [courseCss, null],
      images: [courseImage, "https://www.faa.gov/chart.png"],
    },
  });
  try {
    harness.render();
    await harness.runEffect();
    assert.deepEqual(harness.warmMessages, [{
      type: "CACHE_PUBLIC_DOCUMENT",
      url: `${applicationOrigin}/modules/1`,
    }]);
  } finally {
    harness.restore();
  }
});

test("registration is disabled on auth routes and unsupported clients", async () => {
  for (const [pathname, options] of [
    ["/login", {}],
    ["/signup", {}],
    ["/auth/callback", {}],
    ["/auth/auth-code-error", {}],
    ["/modules/1", { supported: false }],
    ["/modules/1", { secureContext: false }],
  ]) {
    const harness = loadRegistrationHarness(pathname, options);
    try {
      harness.render();
      await harness.runEffect();
      assert.deepEqual(harness.registerCalls, [], `${pathname} must not register in this context`);
    } finally {
      harness.restore();
    }
  }
});

test("a waiting update shows defer-until-session-end guidance without forcing activation", async () => {
  const harness = loadRegistrationHarness("/modules/1", { waiting: true, controller: {} });
  try {
    assert.equal(harness.render(), null);
    await harness.runEffect();
    const notice = harness.render();
    assert.equal(notice.props.role, "status");
    assert.match(textContent(notice), /update is ready/i);
    assert.match(textContent(notice), /finish (?:this|your current) (?:study )?session/i);
    assert.match(textContent(notice), /close (?:every|all).*(?:tab|app)/i);
  } finally {
    harness.restore();
  }
});

test("the worker script bypasses HTTP caches while retaining the existing security-header policy", async () => {
  const configUrl = pathToFileURL(path.join(root, "next.config.mjs"));
  configUrl.searchParams.set("offline-pwa-test", Date.now().toString());
  const nextConfig = (await import(configUrl.href)).default;
  const response = await unstable_getResponseFromNextConfig({
    url: `${applicationOrigin}/sw.js`,
    nextConfig,
  });

  assert.equal(response.headers.get("cache-control"), "no-cache, no-store, must-revalidate");
  assert.match(response.headers.get("content-type") ?? "", /javascript/i);
  assert.ok(response.headers.get("content-security-policy-report-only"));
  assert.equal(response.headers.get("content-security-policy"), null);
});
