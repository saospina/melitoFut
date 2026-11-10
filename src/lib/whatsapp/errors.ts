import { z } from "zod";

export type WhatsAppErrorKind =
  | "invalid_phone"
  | "window_closed"
  | "config"
  | "rate_limited"
  | "meta_rejected"
  | "network"
  | "timeout";

export type WhatsAppError = {
  kind: WhatsAppErrorKind;
  message: string;
  retryable: boolean;
  code?: number;
};

const RATE_LIMIT_CODE = 130429;
const OUTSIDE_WINDOW_CODE = 131047;
const FALLBACK_MESSAGE = "Meta request failed";

const metaErrorBody = z.object({
  error: z.object({
    code: z.number().optional(),
    message: z.string().optional(),
  }),
});

export function mapMetaError(status: number, body: unknown): WhatsAppError {
  const parsed = metaErrorBody.safeParse(body);
  const code = parsed.success ? parsed.data.error.code : undefined;
  const message =
    (parsed.success && parsed.data.error.message) || FALLBACK_MESSAGE;
  const withCode = code === undefined ? {} : { code };

  if (code === OUTSIDE_WINDOW_CODE) {
    return { kind: "window_closed", message, retryable: false, ...withCode };
  }

  if (code === RATE_LIMIT_CODE || status === 429) {
    return { kind: "rate_limited", message, retryable: true, ...withCode };
  }

  return {
    kind: "meta_rejected",
    message,
    retryable: status >= 500,
    ...withCode,
  };
}
