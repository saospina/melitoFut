import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflowPath = fileURLToPath(
  new URL("../../.github/workflows/ci.yml", import.meta.url),
);
const workflow = parse(readFileSync(workflowPath, "utf8"));

describe("CI workflow", () => {
  it("runs the check job on pull requests and pushes to main", () => {
    expect(workflow.on).toEqual({
      pull_request: { branches: ["main"] },
      push: { branches: ["main"] },
    });
  });

  it("runs lint, typecheck, tests and build in the check job", () => {
    const commands = Object.values(workflow.jobs.check.steps)
      .map((step: { run?: string }) => step.run)
      .filter((run: string | undefined) => run !== undefined);

    expect(commands).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm lint",
      "pnpm typecheck",
      "pnpm test",
      "pnpm build",
    ]);
  });

  it("deploys only on push to main, and only after check passes", () => {
    expect(workflow.jobs.deploy.needs).toEqual(["check"]);
    expect(workflow.jobs.deploy.if).toEqual(
      "github.event_name == 'push' && github.ref == 'refs/heads/main'",
    );
  });
});
