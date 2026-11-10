export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type TemplateParameter =
  | { type: "text"; text: string }
  | { type: "payload"; payload: string };

export type TemplateComponent = {
  type: "header" | "body" | "button";
  sub_type?: "quick_reply" | "url";
  index?: string;
  parameters: ReadonlyArray<TemplateParameter>;
};

export type SendTemplateInput = {
  to: string;
  templateName: string;
  language: string;
  components: ReadonlyArray<TemplateComponent>;
};

export type SendTextInput = {
  to: string;
  body: string;
  lastInboundAt: Date | null;
};

export type SendResult = {
  wa_message_id: string;
};
