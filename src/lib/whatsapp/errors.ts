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
