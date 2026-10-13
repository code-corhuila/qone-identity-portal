import { Route, Routes } from "react-router";
import { RegisterPage } from "./pages/RegisterPage";
import { SignInPage } from "./pages/SignInPage";

// The module the shell mounts at /login/* (exposed as ./App), the only public area of Qampus.
// HU-AUT-001: the sign-in at the mount and the student's registration at register.
export function App() {
  return (
    <section aria-labelledby="identity-title">
      <Routes>
        <Route
          index
          element={
            <>
              <h2 id="identity-title">Sign in</h2>
              <SignInPage />
            </>
          }
        />
        <Route
          path="register"
          element={
            <>
              <h2 id="identity-title">Create your account</h2>
              <RegisterPage />
            </>
          }
        />
        <Route path="*" element={<p>Not found</p>} />
      </Routes>
    </section>
  );
}

export default App;
