import { assertBootEnv } from "@/lib/env";

// Next.js calls register() once when the server starts. A missing
// WA_ACCESS_TOKEN stops the server here instead of at the first send.
export function register() {
  assertBootEnv();
}
