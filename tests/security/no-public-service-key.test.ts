import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcDir = fileURLToPath(new URL("../../src", import.meta.url));
const serverOnlyImport = /^import "server-only";$/m;

const sourceFiles = readdirSync(srcDir, { recursive: true })
  .map(String)
  .filter((file) => /\.(ts|tsx)$/.test(file));

describe("server-only secrets", () => {
  it("never references a NEXT_PUBLIC variable that holds a service role key or secret", () => {
    const leaks = sourceFiles.filter((file) =>
      /NEXT_PUBLIC_[A-Z_]*(SERVICE|SECRET)/.test(
        readFileSync(`${srcDir}/${file}`, "utf8"),
      ),
    );

    expect(leaks).toEqual([]);
  });

  it.each([
    "lib/supabase/server.ts",
    "lib/whatsapp/client.ts",
  ])("%s imports server-only so it cannot reach a client bundle", (file) => {
    expect(readFileSync(`${srcDir}/${file}`, "utf8")).toMatch(serverOnlyImport);
  });
});
