import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CANONICAL_ORIGIN = "https://faa107training.org";
const APPROVED_REDIRECT_ORIGINS = new Set([
  CANONICAL_ORIGIN,
  "https://faa107-training.vercel.app",
  "http://localhost:3000",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectOrigin = APPROVED_REDIRECT_ORIGINS.has(requestUrl.origin)
    ? requestUrl.origin
    : CANONICAL_ORIGIN;
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  const next = requestedNext.startsWith("/")
    && !requestedNext.startsWith("//")
    && !requestedNext.includes("\\")
    ? requestedNext
    : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, redirectOrigin));
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", redirectOrigin));
}
