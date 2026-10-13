// Test double of `shell/session`: the portal only reads who is signed in (role, name) and never
// touches the token. Tests sign a user in with `testSession.signInAs(...)`.
export type Role = "STUDENT" | "PROFESSOR" | "ADMIN" | "SERVICE";
export interface SessionUser {
  id: string;
  role: Role;
  name: string;
}

let current: SessionUser | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

let signedToken: string | undefined;

function claimsOf(token: string): { sub?: string; role?: Role; name?: string; exp?: number } | undefined {
  const part = token.split(".")[1];
  if (token.split(".").length !== 3 || !part) return undefined;
  try {
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: string; role?: Role; name?: string; exp?: number };
  } catch {
    return undefined;
  }
}

export const session = {
  /** Like the shell: keeps a well-formed, unexpired JWT and names its user; rejects the rest. */
  signIn(token: string): { ok: true } | { ok: false; reason: "malformed" | "expired" } {
    const claims = claimsOf(token);
    if (!claims?.sub || typeof claims.exp !== "number") return { ok: false, reason: "malformed" };
    if (claims.exp * 1000 <= Date.now()) return { ok: false, reason: "expired" };
    signedToken = token;
    current = { id: claims.sub, role: claims.role ?? "STUDENT", name: claims.name ?? "" };
    notify();
    return { ok: true };
  },
  isAuthenticated: () => current !== undefined,
  // Like the real shell: a fresh object on every call, so a component that forgets to cache its snapshot loops in tests too.
  user: () => (current ? { ...current } : undefined),
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const testSession = {
  signInAs(user: SessionUser): void {
    current = user;
    notify();
  },
  reset(): void {
    current = undefined;
    signedToken = undefined;
    notify();
  },
  /** The token the portal handed to the session, to assert it never kept one itself. */
  signedToken(): string | undefined {
    return signedToken;
  },
  /** The bearer the stub client sends: an opaque test token naming the user and role. */
  token(): string | undefined {
    return current ? `test-token.${current.role}.${current.id}` : undefined;
  },
};
