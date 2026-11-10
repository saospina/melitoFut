import { describe, expect, it } from "vitest";
import { mapMetaError } from "@/lib/whatsapp/errors";

const metaBody = (code: number, message: string) => ({
  error: { message, type: "OAuthException", code, fbtrace_id: "trace" },
});

describe("mapMetaError", () => {
  it("maps 131047 (outside the customer-service window) to window_closed", () => {
    expect(
      mapMetaError(400, metaBody(131047, "Re-engagement message")),
    ).toEqual({
      kind: "window_closed",
      message: "Re-engagement message",
      retryable: false,
      code: 131047,
    });
  });

  it("maps 130429 (rate limit) to a retryable rate_limited error", () => {
    expect(mapMetaError(429, metaBody(130429, "Rate limit hit"))).toEqual({
      kind: "rate_limited",
      message: "Rate limit hit",
      retryable: true,
      code: 130429,
    });
  });

  it.each([
    131026, 132000, 100,
  ])("maps code %i to a non-retryable meta_rejected error", (code) => {
    expect(mapMetaError(400, metaBody(code, "Rejected"))).toEqual({
      kind: "meta_rejected",
      message: "Rejected",
      retryable: false,
      code,
    });
  });

  it("maps a 5xx response to a retryable meta_rejected error", () => {
    expect(mapMetaError(503, {})).toEqual({
      kind: "meta_rejected",
      message: "Meta request failed",
      retryable: true,
    });
  });

  it("maps an unknown error code to a non-retryable meta_rejected error", () => {
    expect(mapMetaError(400, metaBody(999, "Something new"))).toEqual({
      kind: "meta_rejected",
      message: "Something new",
      retryable: false,
      code: 999,
    });
  });
});
