import { describe, expect, it } from "vitest";
import { readWindowMinutes } from "@/lib/env";

const invalidMessage = new Error(
  "WA_CUSTOMER_WINDOW_MINUTES must be a positive integer",
);

describe("readWindowMinutes", () => {
  it("defaults to 1440 minutes when unset", () => {
    expect(readWindowMinutes({})).toEqual(1440);
  });

  it("uses the configured value when it is a positive integer", () => {
    expect(readWindowMinutes({ WA_CUSTOMER_WINDOW_MINUTES: "60" })).toEqual(60);
  });

  it.each([
    "0",
    "-5",
    "1.5",
    "abc",
  ])("rejects %s with a clear error", (value) => {
    expect(() =>
      readWindowMinutes({ WA_CUSTOMER_WINDOW_MINUTES: value }),
    ).toThrow(invalidMessage);
  });
});
