import { describe, expect, it } from "vitest";
import { assertBootEnv } from "@/lib/env";

describe("assertBootEnv", () => {
  it("fails with a named error when WA_ACCESS_TOKEN is missing", () => {
    expect(() => assertBootEnv({})).toThrow(
      new Error("Missing required environment variable: WA_ACCESS_TOKEN"),
    );
  });

  it("passes when WA_ACCESS_TOKEN is set", () => {
    expect(() => assertBootEnv({ WA_ACCESS_TOKEN: "token" })).not.toThrow();
  });
});
