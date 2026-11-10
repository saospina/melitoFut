import "server-only";
import { z } from "zod";
import { readWindowMinutes } from "../env";
import { mapMetaError, type WhatsAppError } from "./errors";
import { isE164 } from "./phone";
import type {
  Result,
  SendResult,
  SendTemplateInput,
  SendTextInput,
} from "./types";
import { isWindowOpen } from "./window";

// Provisional: confirm the current version before release (plan.md R2).
export const GRAPH_API_VERSION = "v21.0";

const DEFAULT_TIMEOUT_MS = 10_000;

export type WhatsAppClientConfig = {
  accessToken: string;
  phoneNumberId: string;
  windowMinutes: number;
  now?: () => Date;
  timeoutMs?: number;
};

export type WhatsAppClient = {
  sendTemplate(
    input: SendTemplateInput,
  ): Promise<Result<SendResult, WhatsAppError>>;
  sendText(input: SendTextInput): Promise<Result<SendResult, WhatsAppError>>;
};

const messageResponse = z.object({
  messages: z.array(z.object({ id: z.string() })).min(1),
});

const failure = (
  error: WhatsAppError,
): { ok: false; error: WhatsAppError } => ({
  ok: false,
  error,
});

const invalidPhone = failure({
  kind: "invalid_phone",
  message: "Phone number must be in E.164 format",
  retryable: false,
});

export function createWhatsAppClient(
  config: WhatsAppClientConfig,
): WhatsAppClient {
  const configError = (): { ok: false; error: WhatsAppError } | undefined => {
    if (!config.accessToken) {
      return failure({
        kind: "config",
        message: "WA_ACCESS_TOKEN is required",
        retryable: false,
      });
    }
    if (!config.phoneNumberId) {
      return failure({
        kind: "config",
        message: "PHONE_NUMBER_ID is required",
        retryable: false,
      });
    }
    return undefined;
  };

  return {
    async sendTemplate(input) {
      const missingConfig = configError();
      if (missingConfig) return missingConfig;
      if (!isE164(input.to)) return invalidPhone;

      return postMessage(config, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to.slice(1),
        type: "template",
        template: {
          name: input.templateName,
          language: { code: input.language },
          components: input.components,
        },
      });
    },

    async sendText(input) {
      const missingConfig = configError();
      if (missingConfig) return missingConfig;
      if (!isE164(input.to)) return invalidPhone;

      const window = isWindowOpen({
        lastInboundAt: input.lastInboundAt,
        now: config.now ? config.now() : new Date(),
        windowMinutes: config.windowMinutes,
      });
      if (!window.open) {
        return failure({
          kind: "window_closed",
          message: "Customer-service window is closed",
          retryable: false,
        });
      }

      return postMessage(config, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to.slice(1),
        type: "text",
        text: { preview_url: false, body: input.body },
      });
    },
  };
}

async function postMessage(
  config: WhatsAppClientConfig,
  body: Record<string, unknown>,
): Promise<Result<SendResult, WhatsAppError>> {
  let response: Response;

  try {
    response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      },
    );
  } catch (error) {
    return failure(
      error instanceof Error && error.name === "TimeoutError"
        ? {
            kind: "timeout",
            message: "Request to WhatsApp timed out",
            retryable: true,
          }
        : {
            kind: "network",
            message: "Network request to WhatsApp failed",
            retryable: true,
          },
    );
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return failure(mapMetaError(response.status, json));
  }

  const parsed = messageResponse.safeParse(json);
  if (!parsed.success) {
    return failure({
      kind: "meta_rejected",
      message: "Unexpected response from WhatsApp",
      retryable: false,
    });
  }

  return { ok: true, value: { wa_message_id: parsed.data.messages[0].id } };
}

// Reads configuration at call time, not at import, so a missing variable
// returns a config error instead of breaking the module.
export function getWhatsAppClient(
  env: Record<string, string | undefined> = process.env,
): WhatsAppClient {
  let windowMinutes: number;

  try {
    windowMinutes = readWindowMinutes(env);
  } catch (error) {
    const invalid = failure({
      kind: "config",
      message:
        error instanceof Error
          ? error.message
          : "Invalid WhatsApp configuration",
      retryable: false,
    });
    return { sendTemplate: async () => invalid, sendText: async () => invalid };
  }

  return createWhatsAppClient({
    accessToken: env.WA_ACCESS_TOKEN ?? "",
    phoneNumberId: env.PHONE_NUMBER_ID ?? "",
    windowMinutes,
  });
}
