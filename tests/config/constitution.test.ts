import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const constitution = readFileSync(
  fileURLToPath(new URL("../../specs/constitution.md", import.meta.url)),
  "utf8",
);

describe("specs/constitution.md", () => {
  it("contains the spec template section", () => {
    expect(constitution).toContain("## 7. Spec Template");
  });
});
