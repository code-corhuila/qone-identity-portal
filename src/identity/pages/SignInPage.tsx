import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { identityApi } from "../api/identityApi";
import { useMountBase } from "../hooks/useMountBase";
import { failureOf, useSignIn } from "../hooks/useSignIn";
import { checkLogin } from "../model/identity";

// HU-AUT-001 (ID-03): e-mail and password. A wrong pair gets one neutral message, so the page
// never tells which accounts exist. Annex H form rules: a label per field, the error beside it,
// the button disabled while the request is pending.
export function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [failure, setFailure] = useState<{ message: string; traceId?: string } | undefined>();
  const [pending, setPending] = useState(false);
  const signIn = useSignIn();
  const id = useId();
  const base = useMountBase();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = checkLogin({ email, password });
    setErrors(found);
    setFailure(undefined);
    if (Object.keys(found).length) return;
    setPending(true);
    try {
      const problem = signIn(await identityApi.login({ email: email.trim(), password }));
      if (problem) setFailure({ message: problem });
    } catch (cause) {
      const f = failureOf(cause);
      const message = f.status === 401 ? "The e-mail or the password is not correct." : f.message;
      setFailure(f.traceId ? { message, traceId: f.traceId } : { message });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate aria-label="Sign in">
      <label htmlFor={`${id}-email`}>E-mail</label>
      <input
        id={`${id}-email`}
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={errors.email ? "true" : undefined}
        aria-describedby={errors.email ? `${id}-email-error` : undefined}
      />
      {errors.email ? <p id={`${id}-email-error`}>{errors.email}</p> : null}
      <label htmlFor={`${id}-password`}>Password</label>
      <input
        id={`${id}-password`}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={errors.password ? "true" : undefined}
        aria-describedby={errors.password ? `${id}-password-error` : undefined}
      />
      {errors.password ? <p id={`${id}-password-error`}>{errors.password}</p> : null}
      {failure ? (
        <div role="alert">
          <p>{failure.message}</p>
          {failure.traceId ? <p>Reference: {failure.traceId}</p> : null}
        </div>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p>
        New student? <Link to={`${base}/register`}>Create your account</Link>
      </p>
    </form>
  );
}
