const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  unstable_getResponseFromNextConfig,
} = require("next/experimental/testing/server");

const root = path.resolve(__dirname, "..");
const applicationOrigin = "https://faa107training.org";
const supabaseProjectOrigin = "https://qbeioesktbpvdlgzrgsm.supabase.co";
const supabaseRealtimeOrigin = "wss://qbeioesktbpvdlgzrgsm.supabase.co";

const representativeUrls = [
  "/",
  "/login",
  "/modules/1",
  "/auth/callback?code=x",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/_next/static/chunk.js",
  "/__security-header-catch-all-probe__/nested/path?x=1",
];

const baselineHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "x-frame-options": "DENY",
};

const expectedCspDirectives = [
  ["default-src", ["'self'"]],
  ["base-uri", ["'self'"]],
  ["object-src", ["'none'"]],
  ["frame-ancestors", ["'none'"]],
  ["script-src", ["'self'", "'unsafe-inline'"]],
  ["style-src", ["'self'", "'unsafe-inline'"]],
  ["img-src", ["'self'", "data:", "blob:", "https:"]],
  ["connect-src", ["'self'", supabaseProjectOrigin, supabaseRealtimeOrigin]],
  ["font-src", ["'self'"]],
  ["form-action", ["'self'"]],
];

const expectedCsp = expectedCspDirectives
  .map(([name, values]) => `${name} ${values.join(" ")}`)
  .join("; ");

async function loadNextConfig() {
  const configUrl = pathToFileURL(path.join(root, "next.config.mjs"));
  configUrl.searchParams.set("test", Date.now().toString());
  return (await import(configUrl.href)).default;
}

async function getConfiguredResponse(nextConfig, url) {
  return unstable_getResponseFromNextConfig({
    url: new URL(url, applicationOrigin).href,
    nextConfig,
  });
}

function parseDirectives(policy) {
  return policy
    .split(";")
    .map((directive) => directive.trim())
    .filter(Boolean)
    .map((directive) => {
      const [name, ...values] = directive.split(/\s+/);
      return [name, values];
    });
}

test("Next config applies the report-only security-header baseline to every route class", async () => {
  const nextConfig = await loadNextConfig();

  for (const url of representativeUrls) {
    const response = await getConfiguredResponse(nextConfig, url);

    for (const [name, value] of Object.entries(baselineHeaders)) {
      assert.equal(response.headers.get(name), value, `${url} must receive ${name}`);
    }

    assert.ok(
      response.headers.get("content-security-policy-report-only"),
      `${url} must receive report-only CSP`,
    );
    assert.equal(
      response.headers.get("content-security-policy"),
      null,
      `${url} must not receive enforced CSP`,
    );
    assert.equal(response.headers.get("report-to"), null, `${url} must not configure Report-To`);
    assert.equal(
      response.headers.get("reporting-endpoints"),
      null,
      `${url} must not configure Reporting-Endpoints`,
    );
  }
});

test("report-only CSP contains only the exact required directives and Supabase origins", async () => {
  const nextConfig = await loadNextConfig();
  const response = await getConfiguredResponse(nextConfig, "/login");
  const policy = response.headers.get("content-security-policy-report-only");

  assert.ok(policy, "report-only CSP header is required");

  const parsedDirectives = parseDirectives(policy);
  const directiveNames = parsedDirectives.map(([name]) => name);
  const directives = new Map(parsedDirectives);

  assert.equal(
    new Set(directiveNames).size,
    directiveNames.length,
    "CSP directives must not be duplicated",
  );
  assert.deepEqual(
    [...directiveNames].sort(),
    expectedCspDirectives.map(([name]) => name).sort(),
    "CSP must not contain unexpected or omitted directives",
  );

  assert.deepEqual(directives.get("default-src"), ["'self'"]);
  assert.deepEqual(directives.get("base-uri"), ["'self'"]);
  assert.deepEqual(directives.get("object-src"), ["'none'"]);
  assert.deepEqual(directives.get("frame-ancestors"), ["'none'"]);
  assert.deepEqual(directives.get("form-action"), ["'self'"]);
  assert.deepEqual(directives.get("script-src"), ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(directives.get("style-src"), ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(directives.get("img-src"), ["'self'", "data:", "blob:", "https:"]);
  assert.deepEqual(directives.get("connect-src"), [
    "'self'",
    supabaseProjectOrigin,
    supabaseRealtimeOrigin,
  ]);
  assert.deepEqual(directives.get("font-src"), ["'self'"]);
  assert.equal(directives.has("report-uri"), false, "CSP must not configure report-uri");
  assert.equal(directives.has("report-to"), false, "CSP must not configure report-to");
  assert.equal(policy, expectedCsp, "CSP serialization must remain exact");
});
