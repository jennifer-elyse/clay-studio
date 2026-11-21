# Spec Kit adoption for Clay Studio

Clay Studio is an **existing working application**. We adopted upstream GitHub [Spec Kit](https://github.github.com/spec-kit/) using its [existing-project guidance](https://github.github.com/spec-kit/how-to/existing-projects.html); the goal is not to regenerate Clay from scratch.

This repository has one root-level Spec Kit project shared by the React chat SDK, Node agent host, Studio app, and starter template. Its guiding principles live at `.specify/memory/constitution.md`. Proposed bounded work starts at `specs/001-clay-material-qa/` with `spec.md`, `plan.md`, `tasks.md`, and `checklists/requirements.md`.

## Using the official toolkit
The initial bootstrap is produced by the official `specify-cli` with Codex integration and Python scripts. It installs Spec Kit project files into `.specify/` and agent skills under `.agents/skills/`. These files are project tooling, not a replacement for any existing Clay Studio CLI commands.

Use the maintained upstream package with Python 3.11+:

```bash
uv tool install specify-cli
specify version
# For another existing clone, without existing project scaffolding:
specify init --here --force --non-interactive --integration codex --script py --ignore-agent-tools
```

After initialization, the normal Spec Kit flow is constitution → specify → clarify → plan → tasks → analyze → implement → converge, reviewing each artifact. The first authored feature documents existing functionality as a baseline, then proposes **visual regression evidence** as future work. Unchecked tasks are intentionally not represented as completed.

Use pull requests against protected `main` for feature implementation, and preserve local WebPs, the 27 animation clip paths, and material maps. Existing build and tests remain authoritative. Install Spec Kit locally only to use its agent workflows; end users downloading the Studio ZIP do not need the CLI.

**Website distinction:** `speckit.org` exists, but the upstream official implementation and documentation used here are `github/spec-kit` and `github.github.com/spec-kit`.
