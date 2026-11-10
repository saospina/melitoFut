import { describe, expect, it } from "vitest";
import { isWindowOpen } from "@/lib/whatsapp/window";

const lastInboundAt = new Date("2026-11-10T10:00:00.000Z");
const dayInMs = 24 * 60 * 60 * 1000;

describe("isWindowOpen", () => {
  it("is open before the window ends and reports the time remaining", () => {
    expect(
      isWindowOpen({
        lastInboundAt,
        now: new Date(lastInboundAt.getTime() + 60 * 60 * 1000),
        windowMinutes: 1440,
      }),
    ).toEqual({ open: true, remainingMs: dayInMs - 60 * 60 * 1000 });
  });

  it("is open one millisecond before the window ends", () => {
    expect(
      isWindowOpen({
        lastInboundAt,
        now: new Date(lastInboundAt.getTime() + dayInMs - 1),
        windowMinutes: 1440,
      }),
    ).toEqual({ open: true, remainingMs: 1 });
  });

  it("is closed exactly when the window ends", () => {
    expect(
      isWindowOpen({
        lastInboundAt,
        now: new Date(lastInboundAt.getTime() + dayInMs),
        windowMinutes: 1440,
      }),
    ).toEqual({ open: false, remainingMs: 0 });
  });

  it("is closed when there has been no inbound message", () => {
    expect(
      isWindowOpen({
        lastInboundAt: null,
        now: new Date(),
        windowMinutes: 1440,
      }),
    ).toEqual({
      open: false,
      remainingMs: 0,
    });
  });

  it("uses a custom window length in minutes", () => {
    expect(
      isWindowOpen({
        lastInboundAt,
        now: new Date(lastInboundAt.getTime() + 61 * 60 * 1000),
        windowMinutes: 60,
      }),
    ).toEqual({ open: false, remainingMs: 0 });
  });
});
