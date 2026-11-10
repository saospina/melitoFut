import { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const url = "https://project.supabase.co";

describe("createSupabaseServerClient", () => {
  it("builds a Supabase client when URL and service role key are set", () => {
    const client = createSupabaseServerClient({
      SUPABASE_URL: url,
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(client).toBeInstanceOf(SupabaseClient);
  });

  it("fails with a named error when the service role key is missing", () => {
    expect(() => createSupabaseServerClient({ SUPABASE_URL: url })).toThrow(
      new Error(
        "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
      ),
    );
  });

  it("fails with a named error when the URL is missing", () => {
    expect(() =>
      createSupabaseServerClient({ SUPABASE_SERVICE_ROLE_KEY: "key" }),
    ).toThrow(new Error("Missing required environment variable: SUPABASE_URL"));
  });
});
