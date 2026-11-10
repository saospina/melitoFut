const MS_PER_MINUTE = 60_000;

export type WindowState = { open: boolean; remainingMs: number };

// The customer-service window opens at the player's last inbound message and
// closes windowMinutes later. No inbound message means it is closed.
export function isWindowOpen({
  lastInboundAt,
  now,
  windowMinutes,
}: {
  lastInboundAt: Date | null;
  now: Date;
  windowMinutes: number;
}): WindowState {
  if (lastInboundAt === null) {
    return { open: false, remainingMs: 0 };
  }

  const remainingMs =
    lastInboundAt.getTime() + windowMinutes * MS_PER_MINUTE - now.getTime();

  if (remainingMs <= 0) {
    return { open: false, remainingMs: 0 };
  }

  return { open: true, remainingMs };
}
