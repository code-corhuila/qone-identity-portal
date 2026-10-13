// Types copied from 07-api/contracts/openapi/qone-identity-api.yaml (Annex H: the portal's
// types mirror the contract field by field), and the checks of RegisterRequest done before the
// request so the person sees each field's problem beside it.

export type Role = "STUDENT" | "PROFESSOR" | "ADMIN" | "SERVICE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentCode?: string | null;
  program?: string | null;
  semester?: number | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  studentCode: string;
  program: string;
  semester: number;
}

export const DEFAULT_PROGRAM = "Ingeniería de Software";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Partial<Record<keyof RegisterRequest, string>>;

export function checkLogin(body: LoginRequest): Partial<Record<keyof LoginRequest, string>> {
  const errors: Partial<Record<keyof LoginRequest, string>> = {};
  if (!EMAIL.test(body.email.trim())) errors.email = "Enter your e-mail.";
  if (!body.password) errors.password = "Enter your password.";
  return errors;
}

export function checkRegistration(body: RegisterRequest): FieldErrors {
  const errors: FieldErrors = {};
  const name = body.name.trim();
  if (name.length < 2 || name.length > 120) errors.name = "Use 2 to 120 characters.";
  if (!EMAIL.test(body.email.trim()) || body.email.length > 120) errors.email = "Enter a valid e-mail.";
  if (body.password.length < 8 || body.password.length > 128) errors.password = "Use 8 to 128 characters.";
  if (!/^[0-9]{6,20}$/.test(body.studentCode.trim())) errors.studentCode = "Use 6 to 20 digits.";
  if (body.program.trim().length < 2 || body.program.trim().length > 80) errors.program = "Use 2 to 80 characters.";
  if (!Number.isInteger(body.semester) || body.semester < 1 || body.semester > 12) errors.semester = "Choose a semester from 1 to 12.";
  return errors;
}
