"use strict";

const CACHE_VERSION = "v7";
const CACHE_PREFIX = "faa107-pwa-";
const CACHE_NAMES = {
  shell: `${CACHE_PREFIX}shell-${CACHE_VERSION}`,
  pages: `${CACHE_PREFIX}pages-${CACHE_VERSION}`,
  assets: `${CACHE_PREFIX}assets-${CACHE_VERSION}`,
};
const CURRENT_CACHES = new Set(Object.values(CACHE_NAMES));
const OFFLINE_FALLBACK_URL = "/offline.html";

const PUBLIC_COURSE_PATHS = new Set([
  "/",
  "/about",
  "/cram-sheet",
  "/exam",
  "/flashcards",
  "/modules",
  "/resources",
  "/study-plan",
]);
const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "code",
  "error",
  "error_description",
  "id_token",
  "refresh_token",
  "session_state",
  "state",
  "token",
]);
const APPROVED_APP_CHUNK_PREFIXES = [
  "/_next/static/chunks/app/about/",
  "/_next/static/chunks/app/cram-sheet/",
  "/_next/static/chunks/app/flashcards/",
  "/_next/static/chunks/app/modules/",
  "/_next/static/chunks/app/resources/",
  "/_next/static/chunks/app/study-plan/",
];
const APPROVED_APP_CHUNK_FILES = [
  "/_next/static/chunks/app/exam/page-",
  "/_next/static/chunks/app/layout-",
  "/_next/static/chunks/app/page-",
];

function normalizedPathname(pathname) {
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

function isPathOrDescendant(pathname, root) {
  return pathname === root || pathname.startsWith(`${root}/`);
}

function isSensitivePath(pathname) {
  return ["/auth", "/login", "/signup"].some((root) => isPathOrDescendant(pathname, root));
}

function isAccountOrApiPath(pathname) {
  return ["/api", "/dashboard", "/exam/results"].some((root) => isPathOrDescendant(pathname, root));
}

function hasSensitiveQuery(url) {
  return [...url.searchParams.keys()].some((key) => SENSITIVE_QUERY_KEYS.has(key.toLowerCase()));
}

function isPublicCourseNavigation(url) {
  const pathname = normalizedPathname(url.pathname);
  if (isSensitivePath(pathname) || isAccountOrApiPath(pathname) || hasSensitiveQuery(url)) return false;
  return PUBLIC_COURSE_PATHS.has(pathname)
    || /^\/modules\/\d+(?:\/(?:quiz|flashcards))?$/.test(pathname);
}

function isApprovedLocalImageSource(source) {
  if (!source) return false;
  let sourceUrl;
  try {
    sourceUrl = new URL(source, self.location.origin);
  } catch {
    return false;
  }
  if (sourceUrl.origin !== self.location.origin) return false;
  return sourceUrl.pathname.startsWith("/images/charts/")
    || sourceUrl.pathname.startsWith("/_next/static/media/");
}

function isGenericNextAsset(url) {
  const { pathname } = url;
  return pathname.startsWith("/_next/static/css/")
    || pathname.startsWith("/_next/static/media/")
    || /^\/_next\/static\/chunks\/[^/]+\.js$/.test(pathname)
    || /^\/_next\/static\/[^/]+\/(?:_buildManifest|_ssgManifest)\.js$/.test(pathname);
}

function isExplicitCourseAsset(url) {
  const { pathname } = url;
  if (APPROVED_APP_CHUNK_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (APPROVED_APP_CHUNK_FILES.some((prefix) => pathname.startsWith(prefix)) && pathname.endsWith(".js")) return true;
  if (pathname.startsWith("/icons/") || pathname.startsWith("/images/charts/")) return true;
  if (pathname === "/favicon.svg" || pathname === "/manifest.webmanifest") return true;
  if (pathname === "/_next/image") return isApprovedLocalImageSource(url.searchParams.get("url"));
  return false;
}

function isNominatableCourseAsset(url) {
  return isGenericNextAsset(url) || isExplicitCourseAsset(url);
}

function classifyRequest(request) {
  if (request.method !== "GET") return null;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.origin !== self.location.origin) return null;
  if (request.headers?.has("authorization")) return null;
  if (hasSensitiveQuery(url)) return null;

  const pathname = normalizedPathname(url.pathname);
  if (isSensitivePath(pathname) || isAccountOrApiPath(pathname)) return null;
  if (request.mode === "navigate") return isPublicCourseNavigation(url) ? "navigation" : null;
  if (isExplicitCourseAsset(url)) return "asset";
  return isGenericNextAsset(url) ? "nominated-asset" : null;
}

function responseMayBeCached(response, kind) {
  if (!response || !response.ok || response.redirected || response.type !== "basic") return false;
  const cacheControl = response.headers.get("cache-control") ?? "";
  if (/(?:^|,)\s*(?:private|no-store)(?:\s|,|=|$)/i.test(cacheControl)) return false;
  if (response.headers.get("set-cookie")) return false;

  if (response.url) {
    let responseUrl;
    try {
      responseUrl = new URL(response.url);
    } catch {
      return false;
    }
    if (responseUrl.origin !== self.location.origin) return false;
    if (kind === "navigation" && !isPublicCourseNavigation(responseUrl)) return false;
    if (kind === "asset" && !isNominatableCourseAsset(responseUrl)) return false;
  }

  if (kind === "navigation") {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) return false;
  }
  return true;
}

async function openCache(name) {
  try {
    return await caches.open(name);
  } catch {
    return null;
  }
}

async function matchCache(cache, request) {
  if (!cache) return undefined;
  try {
    return await cache.match(request);
  } catch {
    return undefined;
  }
}

async function putCache(cache, request, response) {
  if (!cache) return false;
  try {
    await cache.put(request, response.clone());
    return true;
  } catch {
    return false;
  }
}

async function deleteCacheEntry(cache, request) {
  if (!cache) return false;
  try {
    return await cache.delete(request);
  } catch {
    return false;
  }
}

async function matchOfflineFallback() {
  try {
    return await caches.match(OFFLINE_FALLBACK_URL);
  } catch {
    return undefined;
  }
}

async function offlineFallbackResponse() {
  const fallback = await matchOfflineFallback();
  if (fallback) return fallback;
  return new Response("You are offline.", {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (responseMayBeCached(response, "navigation")) {
      await putCache(await openCache(CACHE_NAMES.pages), request, response);
    }
    return response;
  } catch {
    const cache = await openCache(CACHE_NAMES.pages);
    const cached = await matchCache(cache, request);
    if (cached && responseMayBeCached(cached, "navigation")) return cached;
    if (cached) await deleteCacheEntry(cache, request);
    return offlineFallbackResponse();
  }
}

async function cacheFirstAsset(request) {
  const cache = await openCache(CACHE_NAMES.assets);
  const cached = await matchCache(cache, request);
  if (cached && responseMayBeCached(cached, "asset")) return cached;
  if (cached) await deleteCacheEntry(cache, request);
  const response = await fetch(request);
  if (responseMayBeCached(response, "asset")) {
    await putCache(cache, request, response);
  }
  return response;
}

async function cachedNominatedAssetOrNetwork(request) {
  const cache = await openCache(CACHE_NAMES.assets);
  const cached = await matchCache(cache, request);
  if (cached && responseMayBeCached(cached, "asset")) return cached;
  if (cached) await deleteCacheEntry(cache, request);
  return fetch(request);
}

function linkedCourseAssets(html, documentUrl) {
  const urls = [];
  const linkedAssetPattern = /<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(linkedAssetPattern)) {
    try {
      const url = new URL(match[1], documentUrl);
      if (url.origin === self.location.origin && !hasSensitiveQuery(url) && isNominatableCourseAsset(url)) {
        urls.push(url.href);
      }
    } catch {
      // Ignore malformed attributes in an otherwise valid course document.
    }
  }
  return urls;
}

async function cachePublicDocument(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin || !isPublicCourseNavigation(url)) return;

  const request = new Request(url.href, {
    cache: "no-store",
    credentials: "omit",
    headers: { accept: "text/html" },
    redirect: "follow",
  });
  try {
    const response = await fetch(request);
    if (!responseMayBeCached(response, "navigation")) return;
    const assetDiscoveryResponse = response.clone();
    await putCache(await openCache(CACHE_NAMES.pages), request, response);
    try {
      const html = await assetDiscoveryResponse.text();
      await cachePublicAssets(linkedCourseAssets(html, url));
    } catch {
      // Document asset discovery is best-effort and never blocks page warming.
    }
  } catch {
    // Warming is best-effort and never changes the current online navigation.
  }
}

async function cachePublicAssets(rawUrls) {
  if (!Array.isArray(rawUrls)) return;
  const uniqueUrls = [...new Set(rawUrls.filter((value) => typeof value === "string"))].slice(0, 100);
  const cache = await openCache(CACHE_NAMES.assets);
  if (!cache) return;

  await Promise.all(uniqueUrls.map(async (rawUrl) => {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      return;
    }
    if (url.origin !== self.location.origin || hasSensitiveQuery(url) || !isNominatableCourseAsset(url)) return;

    const request = new Request(url.href, {
      cache: "no-store",
      credentials: "omit",
      redirect: "follow",
    });
    try {
      const response = await fetch(request);
      if (responseMayBeCached(response, "asset")) await putCache(cache, request, response);
    } catch {
      // Asset warming is best-effort and never changes the current page.
    }
  }));
}

function isApprovedMessageSource(source) {
  if (!source || typeof source.url !== "string") return false;
  try {
    const sourceUrl = new URL(source.url);
    return sourceUrl.origin === self.location.origin && isPublicCourseNavigation(sourceUrl);
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    openCache(CACHE_NAMES.shell).then(async (cache) => {
      if (!cache) return;
      try {
        await cache.addAll([OFFLINE_FALLBACK_URL]);
      } catch {
        // A storage failure must not prevent the worker from installing.
      }
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.all(names
        .filter((name) => name.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(name))
        .map(async (name) => {
          try {
            await caches.delete(name);
          } catch {
            // A later activation can retry stale-cache retirement.
          }
        }));
    } catch {
      // Cache cleanup is best-effort and must not block activation.
    }
  })());
});

self.addEventListener("message", (event) => {
  if (!isApprovedMessageSource(event.source)) return;
  if (event.data?.type === "CACHE_PUBLIC_DOCUMENT" && typeof event.data.url === "string") {
    event.waitUntil(cachePublicDocument(event.data.url));
  }
});

self.addEventListener("fetch", (event) => {
  const strategy = classifyRequest(event.request);
  if (strategy === "navigation") {
    event.respondWith(networkFirstNavigation(event.request));
  } else if (strategy === "asset") {
    event.respondWith(cacheFirstAsset(event.request));
  } else if (strategy === "nominated-asset") {
    event.respondWith(cachedNominatedAssetOrNetwork(event.request));
  }
});
