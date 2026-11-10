import { describe, expect, it } from "vitest";
import { createWhatsAppClient, getWhatsAppClient } from "@/lib/whatsapp/client";
import { recordRequests, testConfig } from "./helpers";

const now = new Date("2026-11-10T12:00:00.000Z");
const hour = 60 * 60 * 1000;
const client = createWhatsAppClient({ ...testConfig, now: () => now });

describe("sendText", () => {
  it("sends the text message when the customer-service window is open", async () => {
    const requests = recordRequests();

    const result = await client.sendText({
      to: "+573001234567",
      body: "Hola",
      lastInboundAt: new Date(now.getTime() - hour),
    });

    expect(result).toEqual({ ok: true, value: { wa_message_id: "wamid.1" } });
    expect(requests).toEqual([
      {
        authorization: "Bearer test-token",
        contentType: "application/json",
        body: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "573001234567",
          type: "text",
          text: { preview_url: false, body: "Hola" },
        },
      },
    ]);
  });

  it("refuses and sends nothing when the window closed 25 hours ago", async () => {
    const requests = recordRequests();

    const result = await client.sendText({
      to: "+573001234567",
      body: "Hola",
      lastInboundAt: new Date(now.getTime() - 25 * hour),
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "window_closed",
        message: "Customer-service window is closed",
        retryable: false,
      },
    });
    expect(requests).toEqual([]);
  });

  it("refuses and sends nothing when there has been no inbound message", async () => {
    const requests = recordRequests();

    const result = await client.sendText({
      to: "+573001234567",
      body: "Hola",
      lastInboundAt: null,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "window_closed",
        message: "Customer-service window is closed",
        retryable: false,
      },
    });
    expect(requests).toEqual([]);
  });

  it("rejects a non-E.164 number and sends nothing", async () => {
    const requests = recordRequests();

    const result = await client.sendText({
      to: "300 123 4567",
      body: "Hola",
      lastInboundAt: new Date(now.getTime() - hour),
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

  it("returns a config error and sends nothing when WA_CUSTOMER_WINDOW_MINUTES is invalid", async () => {
    const requests = recordRequests();
    const invalidEnvClient = getWhatsAppClient({
      WA_ACCESS_TOKEN: "test-token",
      PHONE_NUMBER_ID: "123456",
      WA_CUSTOMER_WINDOW_MINUTES: "abc",
    });

    const result = await invalidEnvClient.sendText({
      to: "+573001234567",
      body: "Hola",
      lastInboundAt: new Date(Date.now() - hour),
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "config",
        message: "WA_CUSTOMER_WINDOW_MINUTES must be a positive integer",
        retryable: false,
      },
    });
    expect(requests).toEqual([]);
  });
});
