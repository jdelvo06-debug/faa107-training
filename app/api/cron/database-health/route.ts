import { databaseHealth } from "@/lib/database-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(request: Request): Promise<Response> {
  return databaseHealth(request);
}
