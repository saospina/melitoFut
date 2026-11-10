import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readRequiredEnv } from "../env";

// Uses the service role key, so it must only run on the server. The
// server-only import makes importing this from a client component a build error.
export function createSupabaseServerClient(
  env: Record<string, string | undefined> = process.env,
): SupabaseClient {
  return createClient(
    readRequiredEnv("SUPABASE_URL", env),
    readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY", env),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
