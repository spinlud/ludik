## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Browser testing

Verify app behaviour in a real browser with `tools/parity-harness/smoke-home.js` against the Vite dev server. Its usage and how to add checks are in `tools/parity-harness/README.md`. It runs headless with a stubbed Pointer Lock API, so the user keeps their mouse and window focus while it runs. Give any new Playwright script the same headless setup and pointer-lock stub.
