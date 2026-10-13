# qone-identity-portal

> identity bounded context: web UI (remote)

Part of the **Qampus (Quorum One)** distributed system — team `quorum-one`, Grupo 1.
Governance and documentation live in [`qone-docs`](https://github.com/code-corhuila/qone-docs).

## Purpose

The web portal of the **identity** domain (course norm 5.4, Annex H): the sign-in with e-mail
and password and the self-registration of a student (ID-02, ID-03). It is a Module Federation
**remote** named `identity` that exposes `./App` (and `./mocks` for synthetic data); `qone-front`
mounts it at `/login/*`, the only public area of Qampus. The portal never stores the token:
it hands the token identity returns to the shell's session (`shell/session.signIn`), which is
the only place that keeps it, and then returns to the page the person wanted (norm 5.4.1,
verified on the built bundle by `scripts/check-isolation.sh`). It replaces the development
sign-in of norm 5.5.2, which stays only in `develop`.

Specification: `07-api/contracts/openapi/qone-identity-api.yaml` (ID-01..ID-03),
`07-api/authentication.md`, ADR-007 and ADR-009 in `qone-docs`. Story:
`code-corhuila/qone-docs#37` (HU-AUT-001).

## How to run it

Requirements: Node 22 LTS (or 24), npm, and the shell (`qone-front`) running at `VITE_SHELL_URL`.

```bash
cp .env.example .env        # VITE_SHELL_URL only; .env is ignored by git
npm ci
npm run dev                 # http://localhost:5001 (standalone) - or open /login in the shell
```

Checks (`ci.yml` runs the same on every pull request):
```bash
npm run typecheck           # TypeScript strict
npm test                    # Vitest + Testing Library + MSW; contract tests against the synced YAML
npm run build               # remoteEntry.js and assets in dist/
npm run check:isolation     # no gateway URL, no token handling, no raw fetch in dist/
```

`npm run contracts:sync [ref]` refreshes the contract copies in `contracts/openapi/` from `qone-docs`.

Container image and compose (`deploy/`, Annex H and G): `docker build -f deploy/Dockerfile -t
qone-identity-portal:dev .`, `docker run --rm -p 5001:80 qone-identity-portal:dev`, then
`deploy/smoke.sh http://localhost:5001`. NGINX serves `remoteEntry.js` to any origin without
caching it and the hashed chunks as immutable; `deploy/compose.yml` is what `qone-infra` includes
(port 5001 published only in `develop`).

## Dependencies

- `qone-front` at `VITE_SHELL_URL`: `shell/apiClient`, `shell/session` and the mount point `/login/*`.
- `qone-identity-api` behind the gateway; with the shell's `VITE_USE_MOCKS=true` the fixtures answer.

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `qone-docs`.
