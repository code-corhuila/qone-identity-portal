import { Route, Routes } from "react-router";

// The module the shell mounts at /login/* (exposed as ./App), the only public area of Qampus.
// Routes are relative to that mount; the sign-in and the registration of HU-AUT-001 register here.
export function App() {
  return (
    <section aria-labelledby="identity-title">
      <h2 id="identity-title">Sign in</h2>
      <Routes>
        <Route index element={<p>Sign in to Qampus.</p>} />
        <Route path="*" element={<p>Not found</p>} />
      </Routes>
    </section>
  );
}

export default App;
