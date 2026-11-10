const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

// Strict check only: the client never normalizes numbers (storage does, FUT-06).
export function isE164(value: string): boolean {
  return E164_PATTERN.test(value);
}
