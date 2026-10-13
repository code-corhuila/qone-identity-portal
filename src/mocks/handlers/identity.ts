import type { Msw } from "../msw";
import type { AuthResponse, User } from "../../identity/model/identity";

// MSW handlers of qone-identity-api (ID-01..ID-03) over the people of the seed, with the rules of
// the contract: one neutral 401 for a wrong e-mail or password, students only by registration,
// a taken e-mail or student code is 422, the same Idempotency-Key returns the same account with
// 200. The tokens are unsigned look-alikes: the shell's session only reads their claims.
export const DEMO_PASSWORD = "Qampus2026!";

const seed: User[] = [
  { id: "11111111-1111-4111-8111-111111111111", email: "laura.gomez@uni.edu.co", name: "Laura Gómez", role: "STUDENT", studentCode: "20211001", program: "Ingeniería de Software", semester: 6, createdAt: "2026-08-01T12:00:00Z" },
  { id: "22222222-2222-4222-8222-222222222221", email: "carlos.ramirez@uni.edu.co", name: "Carlos Ramírez", role: "PROFESSOR", studentCode: null, program: null, semester: null, createdAt: "2026-08-01T12:00:00Z" },
];
let users: User[] = [];
const passwords = new Map<string, string>();
const byKey = new Map<string, string>();
reset();

const b64url = (value: string) => btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function authOf(user: User): AuthResponse {
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600;
  const payload = { iss: "qone-identity-api", sub: user.id, role: user.role, name: user.name, iat: exp - 8 * 3600, exp };
  const token = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(payload))}.mock-signature`;
  return { token, expiresAt: new Date(exp * 1000).toISOString().replace(/\.\d{3}Z$/, "Z"), user };
}

export function identityHandlers({ http, HttpResponse }: Msw) {
  const envelope = (status: number, error: string, message: string, details?: Array<{ field: string; message: string }>) =>
    HttpResponse.json({ error, message, ...(details ? { details } : {}), traceId: crypto.randomUUID() }, { status });

  return [
    http.get("*/api/v1/identity/health", () => HttpResponse.json({ status: "ok", service: "qone-identity-api", version: "2.0.0" })),

    http.post("*/api/v1/identity/auth/login", async ({ request }) => {
      const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
      const user = users.find((u) => u.email === body?.email?.toLowerCase());
      if (!user || passwords.get(user.id) !== body?.password) return envelope(401, "UNAUTHORIZED", "invalid credentials");
      return HttpResponse.json(authOf(user));
    }),

    http.post("*/api/v1/identity/auth/register", async ({ request }) => {
      const key = request.headers.get("idempotency-key") ?? "";
      if (key.length < 8 || key.length > 128) return envelope(400, "VALIDATION_ERROR", "the request has invalid fields", [{ field: "Idempotency-Key", message: "header required, 8 to 128 characters" }]);
      const earlier = byKey.get(key);
      if (earlier) return HttpResponse.json(authOf(users.find((u) => u.id === earlier)!));
      const body = (await request.json().catch(() => null)) as { name?: string; email?: string; password?: string; studentCode?: string; program?: string; semester?: number } | null;
      if (!body?.email || !body.name || !body.password || !body.studentCode || !body.program) {
        return envelope(400, "VALIDATION_ERROR", "the request has invalid fields", [{ field: "email", message: "required" }]);
      }
      const email = body.email.toLowerCase();
      if (users.some((u) => u.email === email)) return envelope(422, "BUSINESS_RULE_VIOLATION", "an account with this e-mail already exists");
      if (users.some((u) => u.studentCode === body.studentCode)) return envelope(422, "BUSINESS_RULE_VIOLATION", "this student code is already registered");
      const user: User = { id: crypto.randomUUID(), email, name: body.name, role: "STUDENT", studentCode: body.studentCode, program: body.program, semester: body.semester ?? 1, createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z") };
      users.push(user);
      passwords.set(user.id, body.password);
      byKey.set(key, user.id);
      return HttpResponse.json(authOf(user), { status: 201, headers: { Location: `/api/v1/identity/users/${user.id}` } });
    }),
  ];
}

/** Test support: back to the seed people, all with the demo password. */
export function reset(): void {
  users = seed.map((u) => ({ ...u }));
  passwords.clear();
  for (const u of users) passwords.set(u.id, DEMO_PASSWORD);
  byKey.clear();
}

export const people = seed;
