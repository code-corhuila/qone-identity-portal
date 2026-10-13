// @vitest-environment node
// Contract level (ADR-009): the synthetic accounts and the answers of the handlers must match the
// YAML copy of qone-identity-api, and the portal's request checks must agree with RegisterRequest.
import { authOf, people } from "../mocks/handlers/identity";
import { checkRegistration } from "./model/identity";
import { expectValid, loadContract, type Contract } from "../test/contracts";

let identity: Contract;
beforeAll(async () => {
  identity = await loadContract("qone-identity-api.yaml");
});

test("the seed people are Users and a sign-in answers an AuthResponse", () => {
  for (const user of people) expectValid(identity.schema("User"), user, user.email);
  expectValid(identity.response("post", "/identity/auth/login", 200), authOf(people[0]!), "login");
  expectValid(identity.response("post", "/identity/auth/register", 201), authOf(people[0]!), "register");
});

test("what the form accepts is a valid RegisterRequest, and what it refuses is not", () => {
  const ok = { name: "Daniela Ortiz", email: "daniela@uni.edu.co", password: "una-clave-larga", studentCode: "20261234", program: "Ingeniería de Software", semester: 1 };
  expect(checkRegistration(ok)).toEqual({});
  expectValid(identity.schema("RegisterRequest"), ok, "registration");
  const bad = { ...ok, studentCode: "12ab", password: "short" };
  expect(Object.keys(checkRegistration(bad)).sort()).toEqual(["password", "studentCode"]);
  expect(identity.schema("RegisterRequest")(bad)).toBe(false);
});
