import { timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;
type Dependencies = {
  env?: Environment;
  fetch?: typeof fetch;
  signal?: () => AbortSignal;
  log?: (event: Record<string, unknown>) => void;
};

const responseHeaders = { "Cache-Control": "no-store" };

/** A public, non-sensitive marker verifies the Data API without accessing learners. */
export async function databaseHealth(request: Request, dependencies: Dependencies = {}): Promise<Response> {
  const env = dependencies.env ?? process.env;
  const fetcher = dependencies.fetch ?? fetch;
  const signal = dependencies.signal ?? (() => AbortSignal.timeout(5000));
  const log = dependencies.log ?? ((event) => console.info(JSON.stringify(event)));
  const started = Date.now();
  let attempts = 0;
  function finish(status: number, outcome: string): Response {
    log({ event: "database_health", timestamp: new Date().toISOString(), durationMs: Date.now() - started, attempts, outcome });
    return Response.json({ ok: status === 200, outcome }, { status, headers: responseHeaders });
  }

  if (!env.CRON_SECRET) return finish(503, "configuration_error");
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return finish(401, "unauthorized");
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return finish(503, "configuration_error");
  }
  let url: URL;
  try {
    url = new URL("/rest/v1/faa107_healthcheck?select=id,marker&id=eq.1", env.NEXT_PUBLIC_SUPABASE_URL);
    if (url.protocol !== "https:") return finish(503, "configuration_error");
  } catch {
    return finish(503, "configuration_error");
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    attempts += 1;
    try {
      const result = await fetcher(url, {
        cache: "no-store",
        signal: signal(),
        headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      });
      if (!result.ok) {
        if (attempt === 0 && (result.status === 429 || result.status >= 500)) continue;
        return finish(503, "database_error");
      }
      let rows: unknown;
      try {
        rows = await result.json();
      } catch (error) {
        if (error instanceof SyntaxError) return finish(503, "invalid_response");
        throw error;
      }
      if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.id !== 1 || rows[0]?.marker !== "faa107-ok") {
        return finish(503, "invalid_response");
      }
      return finish(200, "healthy");
    } catch {
      if (attempt === 1) return finish(503, "database_unreachable");
    }
  }
  return finish(503, "database_unreachable");
}
