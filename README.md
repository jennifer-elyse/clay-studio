# Clay Studio

Mold freely. Ship safely.

A local chat host that uses **your** Cursor or Copilot seat to plan, generate, and run Clay 1.0 internal apps on your machine.

## Install

Double-click **Clay Studio.command** on a Mac, or **Clay Studio.bat** on Windows.

The first open installs Node.js 26 when this computer does not already have it. That download includes npm. Clay Studio then installs itself and opens http://127.0.0.1:8787. Leave the window open. Closing it stops Clay Studio. The next open only starts the app.

If macOS says it cannot verify **Clay Studio.command**, click **Done**. Do not click Move to Trash. Then open System Settings → Privacy & Security and click **Open Anyway**. Or start it from Terminal, in the `clay-studio` folder: `bash scripts/bootstrap.sh`.

Without a Cursor or Copilot login, Studio runs a **mock seat** so you can click through Plan → Approve → Build → Run.

### Developer loop

```bash
cd clay-studio
npm install
npm run dev
```

That opens the live-reload UI at http://127.0.0.1:5173. `npm start` serves the built app at http://127.0.0.1:8787, which is what the double-click launcher uses.

### Use your Cursor seat

```bash
export CLAY_STUDIO_SEAT=cursor
# or click Sign in — Cursor.auth.login() in the host
npm run dev
```

### Use your Copilot seat

```bash
export CLAY_STUDIO_SEAT=copilot
export GH_TOKEN=gho_...   # or COPILOT_GITHUB_TOKEN
npm run dev
```

## Packages

- `@cswg/clay-chat` — embeddable React chat (pills, plan card, stream)
- `@cswg/agent-host` — AgentPort, Cursor/Copilot adapters, preview supervisor
- `@cswg/clay-studio` — Express host + React shell
- `templates/web-app` — Clay starter copied into each new prototype

## Tests

```bash
npm test
npx playwright install
npm run test:e2e
npm run storybook
```

## Specification-driven development

See [Spec Kit adoption and workflows](docs/spec-kit-adoption.md). The project constitution is in `.specify/memory/constitution.md` and the first bounded visual quality spec is in `specs/001-clay-material-qa/`. Existing Clay app behavior and user-facing commands are unchanged.
