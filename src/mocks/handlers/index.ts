import { http, HttpResponse } from "msw";
import type { Msw } from "../msw";

// Every handler of the identity portal, built with the given msw primitives (ADR-009). The
// handlers of ID-01..ID-03 arrive with the identity client.
export function createHandlers(_msw: Msw) {
  return [];
}

/** The handlers for this portal's own tests (Node server in src/mocks/server.ts). */
export const handlers = createHandlers({ http, HttpResponse });
