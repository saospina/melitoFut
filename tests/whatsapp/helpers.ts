import { HttpResponse, http } from "msw/http";
import { server } from "../setup/msw";

export const GRAPH_MESSAGES_URL =
  "https://graph.facebook.com/v21.0/123456/messages";

export const testConfig = {
  accessToken: "test-token",
  phoneNumberId: "123456",
  windowMinutes: 1440,
};

export type RecordedRequest = {
  authorization: string | null;
  contentType: string | null;
  body: unknown;
};

export const successResponse = () =>
  HttpResponse.json({
    messaging_product: "whatsapp",
    contacts: [{ input: "+573001234567", wa_id: "573001234567" }],
    messages: [{ id: "wamid.1" }],
  });

// Registers a handler for the messages endpoint and returns the list that
// records every request it receives. An empty list means no request was sent.
export function recordRequests(
  respond: () => Response | Promise<Response> = successResponse,
) {
  const requests: RecordedRequest[] = [];

  server.use(
    http.post(GRAPH_MESSAGES_URL, async ({ request }) => {
      requests.push({
        authorization: request.headers.get("authorization"),
        contentType: request.headers.get("content-type"),
        body: await request.json(),
      });
      return respond();
    }),
  );

  return requests;
}
