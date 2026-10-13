import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { identityApi } from "../api/identityApi";
import { useMountBase } from "../hooks/useMountBase";
import { failureOf, useSignIn } from "../hooks/useSignIn";
import { useIdempotencyKey } from "../model/idempotency";
import { DEFAULT_PROGRAM, checkRegistration, type FieldErrors, type RegisterRequest } from "../model/identity";

// HU-AUT-001 (ID-02): a student creates their account and is signed in. Only students register
// themselves. Each field is checked as the contract says before the request; the service's
// answer (a taken e-mail or student code is 422) is shown as it comes, and a field the service
// rejects is marked beside it. One Idempotency-Key per intention: a retry never creates two.
const FIELDS: Array<{ name: keyof RegisterRequest; label: string; type: string; autoComplete: string }> = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
  { name: "studentCode", label: "Student code", type: "text", autoComplete: "off" },
  { name: "program", label: "Program", type: "text", autoComplete: "off" },
  { name: "semester", label: "Semester", type: "number", autoComplete: "off" },
];

export function RegisterPage() {
  const [form, setForm] = useState<RegisterRequest>({ name: "", email: "", password: "", studentCode: "", program: DEFAULT_PROGRAM, semester: 1 });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<{ message: string; traceId?: string } | undefined>();
  const [pending, setPending] = useState(false);
  const { key } = useIdempotencyKey("register");
  const signIn = useSignIn();
  const id = useId();
  const base = useMountBase();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = checkRegistration(form);
    setErrors(found);
    setFailure(undefined);
    if (Object.keys(found).length) return;
    setPending(true);
    try {
      const body = { ...form, name: form.name.trim(), email: form.email.trim(), studentCode: form.studentCode.trim(), program: form.program.trim() };
      const problem = signIn(await identityApi.register(body, key));
      if (problem) setFailure({ message: problem });
    } catch (cause) {
      const f = failureOf(cause);
      const byField: FieldErrors = {};
      for (const d of f.details ?? []) if (d.field in form) byField[d.field as keyof RegisterRequest] = d.message;
      setErrors(byField);
      setFailure(f.traceId ? { message: f.message, traceId: f.traceId } : { message: f.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate aria-label="Create your account">
      {FIELDS.map((field) => {
        const fieldId = `${id}-${field.name}`;
        const error = errors[field.name];
        return (
          <div key={field.name}>
            <label htmlFor={fieldId}>{field.label}</label>
            <input
              id={fieldId}
              type={field.type}
              autoComplete={field.autoComplete}
              value={String(form[field.name])}
              onChange={(e) =>
                setForm((f) => ({ ...f, [field.name]: field.name === "semester" ? Number(e.target.value) : e.target.value }))
              }
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? `${fieldId}-error` : undefined}
            />
            {error ? <p id={`${fieldId}-error`}>{error}</p> : null}
          </div>
        );
      })}
      {failure ? (
        <div role="alert">
          <p>{failure.message}</p>
          {failure.traceId ? <p>Reference: {failure.traceId}</p> : null}
        </div>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? "Creating your account..." : "Create account"}
      </button>
      <p>
        Already registered? <Link to={base || "/"}>Sign in</Link>
      </p>
    </form>
  );
}
