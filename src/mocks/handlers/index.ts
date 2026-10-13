import { http, HttpResponse } from "msw";
import type { Msw } from "../msw";
import { identityHandlers } from "./identity";

// Every handler of the identity portal, built with the given msw primitives (ADR-009):
// ID-01..ID-03 over the people of the seed.
export function createHandlers(msw: Msw) {
  return [...identityHandlers(msw)];
}

/** The handlers for this portal's own tests (Node server in src/mocks/server.ts). */
export const handlers = createHandlers({ http, HttpResponse });
