import { HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { createWhatsAppClient } from "@/lib/whatsapp/client";
import { recordRequests, testConfig } from "./helpers";

const templateInput = {
  to: "+573001234567",
  templateName: "match_invitation",
  language: "es",
  components: [
    {
      type: "body" as const,
      parameters: [{ type: "text" as const, text: "Anthony" }],
    },
    {
      type: "button" as const,
      sub_type: "quick_reply" as const,
      index: "0",
      parameters: [{ type: "payload" as const, payload: "inv_1:going" }],
    },
  ],
};

const metaError = (code: number, message: string, status: number) => () =>
  HttpResponse.json(
    { error: { message, type: "OAuthException", code } },
    { status },
  );

describe("sendTemplate", () => {
  it("sends the template request and returns the WhatsApp message id", async () => {
    const requests = recordRequests();
    const client = createWhatsAppClient(testConfig);

    const result = await client.sendTemplate(templateInput);

    expect(result).toEqual({ ok: true, value: { wa_message_id: "wamid.1" } });
    expect(requests).toEqual([
      {
        authorization: "Bearer test-token",
        contentType: "application/json",
        body: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "573001234567",
          type: "template",
          template: {
            name: "match_invitation",
            language: { code: "es" },
            components: templateInput.components,
          },
        },
      },
    ]);
  });

  it("rejects a non-E.164 number before sending anything", async () => {
    const requests = recordRequests();
    const client = createWhatsAppClient(testConfig);

    const result = await client.sendTemplate({
      ...templateInput,
      to: "300 123 4567",
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "invalid_phone",
        message: "Phone number must be in E.164 format",
        retryable: false,
      },
    });
    expect(requests).toEqual([]);
  });

  it("returns a non-retryable meta_rejected error for a Meta rejection", async () => {
    recordRequests(metaError(131026, "Message undeliverable", 400));
    const client = createWhatsAppClient(testConfig);

    const result = await client.sendTemplate(templateInput);

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "meta_rejected",
        message: "Message undeliverable",
        retryable: false,
        code: 131026,
      },
    });
  });

  it("returns a retryable rate_limited error on Meta rate limits", async () => {
    recordRequests(metaError(130429, "Rate limit hit", 429));
    const client = createWhatsAppClient(testConfig);

    const result = await client.sendTemplate(templateInput);

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "rate_limited",
        message: "Rate limit hit",
        retryable: true,
        code: 130429,
      },
    });
  });

  it("returns a retryable timeout error when Meta does not answer in time", async () => {
    recordRequests(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return HttpResponse.json({});
    });
    const client = createWhatsAppClient({ ...testConfig, timeoutMs: 50 });

    const result = await client.sendTemplate(templateInput);

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "timeout",
        message: "Request to WhatsApp timed out",
        retryable: true,
      },
    });
  });

  it("returns a retryable network error when the connection fails", async () => {
    recordRequests(() => HttpResponse.error());
    const client = createWhatsAppClient(testConfig);

    const result = await client.sendTemplate(templateInput);

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "network",
        message: "Network request to WhatsApp failed",
        retryable: true,
      },
    });
  });

  it("returns a config error and sends nothing when PHONE_NUMBER_ID is missing", async () => {
    const requests = recordRequests();
    const client = createWhatsAppClient({ ...testConfig, phoneNumberId: "" });

    const result = await client.sendTemplate(templateInput);

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "config",
        message: "PHONE_NUMBER_ID is required",
        retryable: false,
      },
    });
    expect(requests).toEqual([]);
  });
});
