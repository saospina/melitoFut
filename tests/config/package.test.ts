import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../package.json", import.meta.url)),
    "utf8",
  ),
);

describe("package.json scripts", () => {
  it("runs the test suite without allowing zero tests", () => {
    expect(packageJson.scripts.test).toEqual("vitest run");
    expect(packageJson.scripts.test).not.toContain("passWithNoTests");
  });
});
