import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { App } from "../App";
import { DEMO_PASSWORD, reset } from "../../mocks/handlers/identity";
import { session, testSession } from "../../test/shell/session";

function open(path: string, from?: string) {
  render(
    <MemoryRouter initialEntries={[{ pathname: path, state: from ? { from: { pathname: from } } : null }]}>
      <Routes>
        <Route path="/login/*" element={<App />} />
        <Route path="*" element={<p>Landed on the app</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => reset());

test("a seed person signs in, the token goes to the shell's session and the page they wanted opens", async () => {
  open("/login", "/billing/invoice");
  await userEvent.type(screen.getByLabelText("E-mail"), "laura.gomez@uni.edu.co");
  await userEvent.type(screen.getByLabelText("Password"), DEMO_PASSWORD);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Landed on the app")).toBeInTheDocument();
  expect(session.user()).toMatchObject({ name: "Laura Gómez", role: "STUDENT" });
  expect(testSession.signedToken()).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
});

test("a wrong password gets one neutral message and nobody is signed in", async () => {
  open("/login");
  await userEvent.type(screen.getByLabelText("E-mail"), "laura.gomez@uni.edu.co");
  await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("The e-mail or the password is not correct.");
  expect(session.isAuthenticated()).toBe(false);
});

test("empty fields are marked beside them without a request", async () => {
  open("/login");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(screen.getByText("Enter your e-mail.")).toBeInTheDocument();
  expect(screen.getByText("Enter your password.")).toBeInTheDocument();
  expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
});

test("a student registers from the sign-in link and lands signed in", async () => {
  open("/login");
  await userEvent.click(screen.getByRole("link", { name: "Create your account" }));
  await userEvent.type(screen.getByLabelText("Full name"), "Daniela Ortiz");
  await userEvent.type(screen.getByLabelText("E-mail"), "daniela.ortiz@uni.edu.co");
  await userEvent.type(screen.getByLabelText("Password"), "una-clave-larga");
  await userEvent.type(screen.getByLabelText("Student code"), "20261234");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("Landed on the app")).toBeInTheDocument();
  expect(session.user()).toMatchObject({ name: "Daniela Ortiz", role: "STUDENT" });
});

test("the registration checks each field and shows a taken e-mail as the service says", async () => {
  open("/login/register");
  await userEvent.type(screen.getByLabelText("Password"), "short");
  await userEvent.type(screen.getByLabelText("Student code"), "12ab");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByText("Use 8 to 128 characters.")).toBeInTheDocument();
  expect(screen.getByText("Use 6 to 20 digits.")).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Full name"), "Laura Gómez");
  await userEvent.type(screen.getByLabelText("E-mail"), "laura.gomez@uni.edu.co");
  await userEvent.clear(screen.getByLabelText("Password"));
  await userEvent.type(screen.getByLabelText("Password"), "otra-clave-larga");
  await userEvent.clear(screen.getByLabelText("Student code"));
  await userEvent.type(screen.getByLabelText("Student code"), "20999999");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("an account with this e-mail already exists");
  expect(session.isAuthenticated()).toBe(false);
});
