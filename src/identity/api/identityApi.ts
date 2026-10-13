import { apiClient } from "shell/apiClient";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../model/identity";

// Typed calls of qone-identity-api over the shell's client (Annex H: never fetch). Both are
// public operations; the token they return goes straight to the shell's session.
const BASE = "/api/v1/identity";

export const identityApi = {
  /** ID-03: a wrong e-mail or password is 401 with one neutral message for both. */
  login: (body: LoginRequest) => apiClient.post<AuthResponse>(`${BASE}/auth/login`, body),
  /** ID-02: a STUDENT account, signed in; one Idempotency-Key per intention, reused on retry. */
  register: (body: RegisterRequest, idempotencyKey: string) =>
    apiClient.post<AuthResponse>(`${BASE}/auth/register`, body, { idempotencyKey }),
};
