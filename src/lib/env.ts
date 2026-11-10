import { z } from "zod";

type Env = Record<string, string | undefined>;

const DEFAULT_WINDOW_MINUTES = 1440;

const windowMinutesSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive());

export function readRequiredEnv(name: string, env: Env = process.env): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Only WA_ACCESS_TOKEN is checked at boot; other variables are checked where used.
export function assertBootEnv(env: Env = process.env): void {
  readRequiredEnv("WA_ACCESS_TOKEN", env);
}

export function readWindowMinutes(env: Env = process.env): number {
  const raw = env.WA_CUSTOMER_WINDOW_MINUTES;

  if (raw === undefined || raw === "") {
    return DEFAULT_WINDOW_MINUTES;
  }

  const parsed = windowMinutesSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("WA_CUSTOMER_WINDOW_MINUTES must be a positive integer");
  }

  return parsed.data;
}
