import { useLocation, useNavigate } from "react-router";
import { session } from "shell/session";
import type { AuthResponse } from "../model/identity";

// Hands the token identity issued to the shell's session (the only place that keeps it, norm
// 5.4.1) and returns to the page the person wanted before the sign-in, or to the home.
export function useSignIn(): (auth: AuthResponse) => string | undefined {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";
  return (auth) => {
    const result = session.signIn(auth.token);
    if (!result.ok) return "The session could not be opened. Try again.";
    void navigate(from, { replace: true });
    return undefined;
  };
}

/** The message and the reference of a failed call, as the shell's ApiError carries them. */
export function failureOf(cause: unknown): {
  message: string;
  status?: number;
  traceId?: string;
  details?: Array<{ field: string; message: string }>;
} {
  const error = cause instanceof Error ? cause : new Error(String(cause));
  const api = error as Error & { status?: number; traceId?: string; serverMessage?: string; details?: Array<{ field: string; message: string }> };
  return {
    message: api.serverMessage || error.message,
    ...(api.status !== undefined ? { status: api.status } : {}),
    ...(api.traceId ? { traceId: api.traceId } : {}),
    ...(api.details ? { details: api.details } : {}),
  };
}
