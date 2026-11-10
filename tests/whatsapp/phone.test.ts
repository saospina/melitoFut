import { describe, expect, it } from "vitest";
import { isE164 } from "@/lib/whatsapp/phone";

describe("isE164", () => {
  it("accepts a Colombian mobile number in E.164 format", () => {
    expect(isE164("+573001234567")).toEqual(true);
  });

  it("rejects numbers that are not strict E.164", () => {
    const results = [
      "300 123 4567",
      "3001234567",
      "+0123",
      "+57 300 123 4567",
      "",
    ].map((value) => [value, isE164(value)]);

    expect(results).toEqual([
      ["300 123 4567", false],
      ["3001234567", false],
      ["+0123", false],
      ["+57 300 123 4567", false],
      ["", false],
    ]);
  });
});
