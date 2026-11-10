import { describe, expect, it } from "vitest";
import { assertBootEnv, readRequiredEnv } from "@/lib/env";

describe("lazy environment validation", () => {
  it("does not fail at boot when SUPABASE_URL is missing", () => {
    expect(() => assertBootEnv({ WA_ACCESS_TOKEN: "token" })).not.toThrow();
  });

  it("fails with a named error when a required variable is read and missing", () => {
    expect(() => readRequiredEnv("SUPABASE_URL", {})).toThrow(
      new Error("Missing required environment variable: SUPABASE_URL"),
    );
  });

  it("returns the value when a required variable is set", () => {
    expect(
      readRequiredEnv("SUPABASE_URL", {
        SUPABASE_URL: "https://x.supabase.co",
      }),
    ).toEqual("https://x.supabase.co");
  });
});
